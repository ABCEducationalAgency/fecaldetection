import base64
import io
import logging
from pathlib import Path
from typing import Dict, Optional

import matplotlib.cm as cm
import numpy as np
import tensorflow as tf
from PIL import Image

from prediction import load_keras_model, preprocess_image

logger = logging.getLogger(__name__)

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
        "backbone_name": "convnext",
        "last_conv_name": "conv5_block3",
    },
    "mobilenetv2": {
        "backbone_name": "mobilenetv2",
        "last_conv_name": "out_relu",
    },
    "efficientnetb0": {
        "backbone_name": "efficientnetb0",
        "last_conv_name": "top_conv",
    },
    "nasnetmobile": {
        "backbone_name": "nasnetmobile",
        "last_conv_name": "normal_concat_12",
    },
    "densenet169": {
        "backbone_name": "densenet169",
        "last_conv_name": "conv5_block32_concat",
    },
}


def _find_layer(model, layer_name: str):
    try:
        return model.get_layer(layer_name)
    except ValueError:
        for layer in model.layers:
            if hasattr(layer, "layers"):
                try:
                    return layer.get_layer(layer_name)
                except ValueError:
                    continue
    raise ValueError(f"Layer '{layer_name}' not found in model or nested submodels.")


def _layer_exists(model, layer_name: str) -> bool:
    try:
        _find_layer(model, layer_name)
        return True
    except ValueError:
        return False


def _get_backbone_key_from_filename(model_filename: str) -> Optional[str]:
    lower = model_filename.lower()
    if "resnet50" in lower:
        return "resnet50"
    if "vgg19" in lower:
        return "vgg19"
    if "convnext" in lower:
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


def get_backbone_config(model_filename: str, model) -> Dict[str, str]:
    key = _get_backbone_key_from_filename(model_filename)
    if key and key in BACKBONE_CONFIGS:
        config = BACKBONE_CONFIGS[key]
        if _layer_exists(model, config["last_conv_name"]):
            return config

    for config in BACKBONE_CONFIGS.values():
        if _layer_exists(model, config["last_conv_name"]):
            return config

    raise ValueError(
        f"Unable to determine backbone config for model '{model_filename}'. "
        "Provide a filename containing a known backbone or verify the model structure."
    )


def build_gradcam_models(model, backbone_config: Dict[str, str]):
    last_conv_layer = _find_layer(model, backbone_config["last_conv_name"])
    last_conv_layer_model = tf.keras.Model(model.inputs, last_conv_layer.output)
    classifier_model = tf.keras.Model(last_conv_layer.output, model.output)
    return last_conv_layer_model, classifier_model


def make_gradcam_heatmap(img_array, last_conv_layer_model, classifier_model):
    img_tensor = tf.convert_to_tensor(img_array, dtype=tf.float32)

    with tf.GradientTape() as tape:
        last_conv_output = last_conv_layer_model(img_tensor, training=False)
        tape.watch(last_conv_output)

        preds = classifier_model(last_conv_output, training=False)
        prob = preds[:, 0]

    grads = tape.gradient(prob, last_conv_output)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    last_conv_output = last_conv_output[0]
    heatmap = tf.reduce_sum(last_conv_output * pooled_grads, axis=-1)
    heatmap = tf.maximum(heatmap, 0)
    max_val = tf.reduce_max(heatmap)
    if max_val > 0:
        heatmap /= max_val

    return heatmap.numpy(), preds.numpy()


def apply_heatmap(original_img: Image.Image, heatmap, alpha=0.35) -> Image.Image:
    original = np.array(original_img.convert("RGB")).astype("float32")
    heatmap_img = Image.fromarray(np.uint8(255 * heatmap)).resize(
        (original.shape[1], original.shape[0])
    )
    heatmap_uint8 = np.array(heatmap_img)

    cmap = cm.get_cmap("jet")
    colored_heatmap = cmap(heatmap_uint8 / 255.0)[:, :, :3]
    colored_heatmap = (colored_heatmap * 255).astype("float32")

    superimposed = original * (1 - alpha) + colored_heatmap * alpha
    superimposed = np.clip(superimposed, 0, 255).astype("uint8")
    return Image.fromarray(superimposed)


def _image_to_base64(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def generate_gradcam_base64(source_image: Image.Image, model_path: Path, size: int) -> str:
    model = load_keras_model(model_path)
    image_tensor = preprocess_image(source_image, size)
    backbone_config = get_backbone_config(model_path.name, model)
    last_conv_layer_model, classifier_model = build_gradcam_models(model, backbone_config)
    heatmap, _ = make_gradcam_heatmap(image_tensor, last_conv_layer_model, classifier_model)
    overlay = apply_heatmap(source_image, heatmap, alpha=0.35)
    return _image_to_base64(overlay)
