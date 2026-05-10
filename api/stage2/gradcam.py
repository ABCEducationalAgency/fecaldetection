import base64
import io
import logging
from pathlib import Path
from typing import Dict, Optional, List, Tuple

import matplotlib
import numpy as np
import tensorflow as tf
from PIL import Image

from prediction import load_keras_model, preprocess_image

logger = logging.getLogger(__name__)


# ============================================================
# BACKBONE CONFIGS
# ============================================================

BACKBONE_CONFIGS = {
    "resnet50": {
        "backbone_name": "resnet50",
        "last_conv_name": "conv5_block3_out",
    },
    "vgg19": {
        "backbone_name": "vgg19",
        "last_conv_name": "block5_conv4",
    },
    "convnext": {
        # ConvNeXt backbone name may be convnext_base or similar.
        # The code below also supports partial matching.
        "backbone_name": "convnext",
        # This may fail for some ConvNeXt saves, so fallback will auto-pick last 4D layer.
        "last_conv_name": None,
    },
    "mobilenetv2": {
        # Your saved model backbone may be named mobilenetv2_1.00_224.
        # The code below supports partial matching.
        "backbone_name": "mobilenetv2",
        "last_conv_name": "out_relu",
    },
    "efficientnetb0": {
        "backbone_name": "efficientnetb0",
        "last_conv_name": "top_conv",
    },
    "nasnetmobile": {
        "backbone_name": "nasnetmobile",
        # This may vary depending on Keras version/save, fallback will auto-pick last 4D layer.
        "last_conv_name": "normal_concat_12",
    },
    "densenet169": {
        "backbone_name": "densenet169",
        "last_conv_name": "conv5_block32_concat",
    },
}


# ============================================================
# MODEL / LAYER HELPERS
# ============================================================

def _get_backbone_key_from_filename(model_filename: str) -> Optional[str]:
    lower = model_filename.lower()

    if "resnet50" in lower:
        return "resnet50"

    if "vgg19" in lower:
        return "vgg19"

    if "convnextbase" in lower or "convnext" in lower:
        return "convnext"

    if "mobilenetv2" in lower:
        return "mobilenetv2"

    if "efficientnetb0" in lower:
        return "efficientnetb0"

    if "nasnetmobile" in lower:
        return "nasnetmobile"

    if "densenet169" in lower:
        return "densenet169"

    return None


def _find_layer_recursive(model_or_layer, layer_name: str):
    """
    Find layer by name inside a model, including nested Keras models.
    """
    for layer in model_or_layer.layers:
        if layer.name == layer_name:
            return layer

        if hasattr(layer, "layers") and len(layer.layers) > 0:
            try:
                return _find_layer_recursive(layer, layer_name)
            except ValueError:
                pass

    raise ValueError(f"Layer '{layer_name}' not found.")


def _layer_exists(model_or_layer, layer_name: Optional[str]) -> bool:
    if not layer_name:
        return False

    try:
        _find_layer_recursive(model_or_layer, layer_name)
        return True
    except ValueError:
        return False


def _get_backbone(model, backbone_name: str):
    """
    Find backbone inside the outer model.

    Handles exact names and partial names such as:
    - mobilenetv2
    - mobilenetv2_1.00_224
    - convnext
    - convnext_base
    """
    # Exact top-level layer name
    try:
        return model.get_layer(backbone_name)
    except ValueError:
        pass

    # Partial match among nested Keras models
    for layer in model.layers:
        if isinstance(layer, tf.keras.Model):
            if backbone_name.lower() in layer.name.lower():
                return layer

    # Partial match among any nested models
    for layer in model.layers:
        if hasattr(layer, "layers") and len(layer.layers) > 0:
            if backbone_name.lower() in layer.name.lower():
                return layer

    # Fallback: first large nested model is probably the backbone
    for layer in model.layers:
        if isinstance(layer, tf.keras.Model) and len(layer.layers) > 5:
            return layer

    return None


def _get_all_4d_layers(model_or_layer) -> List[tf.keras.layers.Layer]:
    """
    Return layers with 4D output tensors: batch, height, width, channels.
    These are valid GradCAM candidates.
    """
    candidates = []

    for layer in model_or_layer.layers:
        try:
            shape = layer.output.shape

            if len(shape) == 4:
                candidates.append(layer)

        except Exception:
            pass

        if hasattr(layer, "layers") and len(layer.layers) > 0:
            candidates.extend(_get_all_4d_layers(layer))

    return candidates


def _find_last_4d_layer(model_or_layer):
    candidates = _get_all_4d_layers(model_or_layer)

    if not candidates:
        raise ValueError("No 4D feature-map layer found for GradCAM.")

    return candidates[-1]


def _get_head_layers_after_backbone(model, backbone) -> List[tf.keras.layers.Layer]:
    """
    For a model like:
        Sequential([backbone, GAP, Dense, Dropout, Dense])

    Return:
        [GAP, Dense, Dropout, Dense]
    """
    head_layers = []
    found_backbone = False

    for layer in model.layers:
        if layer is backbone:
            found_backbone = True
            continue

        if found_backbone:
            head_layers.append(layer)

    if not head_layers:
        raise ValueError("No classification head layers found after backbone.")

    return head_layers


def _get_backbone_config(model_filename: str, model) -> Dict[str, Optional[str]]:
    """
    Determine backbone config from filename and model structure.
    """
    key = _get_backbone_key_from_filename(model_filename)

    if key and key in BACKBONE_CONFIGS:
        config = BACKBONE_CONFIGS[key]
        backbone = _get_backbone(model, config["backbone_name"])

        if backbone is not None:
            return config

    # Fallback: try each known config
    for config in BACKBONE_CONFIGS.values():
        backbone = _get_backbone(model, config["backbone_name"])

        if backbone is not None:
            return config

    raise ValueError(
        f"Unable to determine backbone config for model '{model_filename}'. "
        "Make sure the model contains a nested backbone or filename contains a known backbone name."
    )


# ============================================================
# GRADCAM MODEL BUILDING
# ============================================================

def build_gradcam_model_parts(model, backbone_config: Dict[str, Optional[str]]):
    """
    Build GradCAM feature extractor and collect head layers.

    This is the important fix.

    Instead of trying:
        Model(last_conv.output, model.output)

    We do:
        backbone input -> [selected conv output, backbone output]
        then manually pass backbone output through the outer head layers.
    """
    backbone = _get_backbone(model, backbone_config["backbone_name"])

    if backbone is None:
        raise ValueError(
            f"Backbone '{backbone_config['backbone_name']}' not found in model."
        )

    last_conv_name = backbone_config.get("last_conv_name")

    if last_conv_name and _layer_exists(backbone, last_conv_name):
        target_layer = _find_layer_recursive(backbone, last_conv_name)
    else:
        target_layer = _find_last_4d_layer(backbone)

    head_layers = _get_head_layers_after_backbone(model, backbone)

    logger.info("GradCAM backbone: %s", backbone.name)
    logger.info("GradCAM target layer: %s", target_layer.name)
    logger.info("GradCAM target layer shape: %s", target_layer.output.shape)
    logger.info("GradCAM head layers: %s", [layer.name for layer in head_layers])

    backbone_feature_model = tf.keras.Model(
        inputs=backbone.inputs,
        outputs=[
            target_layer.output,
            backbone.output,
        ],
    )

    return backbone_feature_model, head_layers, target_layer.name


def make_gradcam_heatmap(
    img_array,
    backbone_feature_model,
    head_layers: List[tf.keras.layers.Layer],
    explain_class: str = "positive",
):
    """
    Generate GradCAM heatmap.

    explain_class options for binary sigmoid:
    - "positive": explain class 1 / positive signal
    - "negative": explain class 0 / negative signal
    - "predicted": explain whatever the model predicted
    """
    img_tensor = tf.convert_to_tensor(img_array, dtype=tf.float32)

    with tf.GradientTape() as tape:
        last_conv_output, backbone_output = backbone_feature_model(
            img_tensor,
            training=False,
        )

        x = backbone_output

        for layer in head_layers:
            x = layer(x, training=False)

        preds = x

        if preds.shape[-1] == 1:
            prob = preds[:, 0]

            if explain_class == "positive":
                class_channel = prob

            elif explain_class == "negative":
                class_channel = 1.0 - prob

            elif explain_class == "predicted":
                class_channel = tf.where(prob >= 0.5, prob, 1.0 - prob)

            else:
                raise ValueError(
                    "explain_class must be 'positive', 'negative', or 'predicted'."
                )

        else:
            predicted_class = tf.argmax(preds[0])
            class_channel = preds[:, predicted_class]

    grads = tape.gradient(class_channel, last_conv_output)

    if grads is None:
        raise ValueError("Gradients are None. Try another GradCAM target layer.")

    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    last_conv_output = last_conv_output[0]

    heatmap = tf.reduce_sum(last_conv_output * pooled_grads, axis=-1)
    heatmap = tf.maximum(heatmap, 0)

    max_val = tf.reduce_max(heatmap)

    if max_val > 0:
        heatmap = heatmap / (max_val + 1e-8)

    return heatmap.numpy(), preds.numpy()


# ============================================================
# IMAGE OVERLAY / BASE64
# ============================================================

def apply_heatmap(original_img: Image.Image, heatmap, alpha=0.35) -> Image.Image:
    original = np.array(original_img.convert("RGB")).astype("float32")

    heatmap_img = Image.fromarray(np.uint8(255 * heatmap)).resize(
        (original.shape[1], original.shape[0])
    )

    heatmap_uint8 = np.array(heatmap_img)

    cmap = matplotlib.colormaps.get_cmap("jet")
    colored_heatmap = cmap(heatmap_uint8 / 255.0)[:, :, :3]
    colored_heatmap = (colored_heatmap * 255).astype("float32")

    superimposed = original * (1 - alpha) + colored_heatmap * alpha
    superimposed = np.clip(superimposed, 0, 255).astype("uint8")

    return Image.fromarray(superimposed)


def _image_to_base64(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    return "data:image/png;base64," + base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")


# ============================================================
# PUBLIC API FUNCTION
# ============================================================

def generate_gradcam_base64(
    source_image: Image.Image,
    model_path: Path,
    size: int,
    explain_class: str = "positive",
) -> str:
    """
    Main function used by your API.

    explain_class:
    - "positive": explains class 1 / positive class
    - "negative": explains class 0 / negative class
    - "predicted": explains predicted class
    """
    model = load_keras_model(model_path)

    # Your existing preprocessing pipeline.
    image_tensor = preprocess_image(source_image, size)

    # Important: call model once so it is built.
    _ = model(tf.convert_to_tensor(image_tensor, dtype=tf.float32), training=False)

    backbone_config = _get_backbone_config(model_path.name, model)

    backbone_feature_model, head_layers, target_layer_name = build_gradcam_model_parts(
        model=model,
        backbone_config=backbone_config,
    )

    heatmap, preds = make_gradcam_heatmap(
        img_array=image_tensor,
        backbone_feature_model=backbone_feature_model,
        head_layers=head_layers,
        explain_class=explain_class,
    )

    logger.info("GradCAM model: %s", model_path.name)
    logger.info("GradCAM target layer used: %s", target_layer_name)
    logger.info("GradCAM prediction: %s", preds)

    overlay = apply_heatmap(source_image, heatmap, alpha=0.35)

    return _image_to_base64(overlay)