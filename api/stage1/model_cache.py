import gc
from collections import OrderedDict
from pathlib import Path

import tensorflow as tf

from prediction import load_keras_model


MAX_CACHED_MODELS = 1

_model_cache = OrderedDict()


def get_model(model_path: Path):
    key = str(model_path)

    if key in _model_cache:
        _model_cache.move_to_end(key)
        return _model_cache[key]

    model = load_keras_model(model_path)
    _model_cache[key] = model

    while len(_model_cache) > MAX_CACHED_MODELS:
        old_key, old_model = _model_cache.popitem(last=False)

        del old_model
        gc.collect()
        tf.keras.backend.clear_session()

    return model


def clear_model_cache():
    _model_cache.clear()
    gc.collect()
    tf.keras.backend.clear_session()