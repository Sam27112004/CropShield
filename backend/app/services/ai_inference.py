from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import logging
from pathlib import Path

import numpy as np

from app.core.config import get_settings
from app.utils.domain_helpers import clamp_percentage

CLASS_NAMES = ["Healthy crop", "Moderate damage", "Severe damage"]
logger = logging.getLogger(__name__)


@dataclass(slots=True)
class PredictionResult:
    model_version: str
    predicted_class: str
    damage_probability: float
    damaged_area_percentage: float
    class_probabilities: dict[str, float] | None = None


def _vegetation_score(image: np.ndarray) -> float:
    data = image.astype(np.float32)
    if data.max() > 1.0:
        data = data / 255.0
    green = data[..., 1]
    red = data[..., 0]
    blue = data[..., 2]
    return float(np.mean((green * 1.2) - (red * 0.5) - (blue * 0.2)))


def _heuristic_prediction(image: np.ndarray) -> PredictionResult:
    score = _vegetation_score(image)
    if score > 0.28:
        predicted_class = "Healthy crop"
        damage_probability = 0.18
        damaged_area_percentage = 12.0
    elif score > 0.08:
        predicted_class = "Moderate damage"
        damage_probability = 0.58
        damaged_area_percentage = 44.0
    else:
        predicted_class = "Severe damage"
        damage_probability = 0.86
        damaged_area_percentage = 76.0

    class_probabilities = {
        "Healthy crop": max(0.0, 1.0 - damage_probability),
        "Moderate damage": damage_probability * 0.45,
        "Severe damage": damage_probability * 0.55,
    }
    total = sum(class_probabilities.values())
    normalized = {k: float(v / total) for k, v in class_probabilities.items()}
    return PredictionResult(
        model_version="heuristic-v1",
        predicted_class=predicted_class,
        damage_probability=float(np.clip(damage_probability, 0.0, 1.0)),
        damaged_area_percentage=clamp_percentage(damaged_area_percentage),
        class_probabilities=normalized,
    )


def _preprocess_image(image: np.ndarray, image_size: tuple[int, int] = (64, 64)) -> np.ndarray:
    """Preprocess image for model inference: normalize to [0,1] and resize to target dimensions."""
    data = image.astype(np.float32)
    if data.max() > 1.0:
        data = data / 255.0
    
    try:
        import tensorflow as tf
        tensor = tf.convert_to_tensor(data)
        tensor = tf.image.resize(tensor, image_size)
        return tf.expand_dims(tensor, axis=0).numpy()
    except ImportError:
        # Fallback if TensorFlow import fails
        from scipy import ndimage
        resized = ndimage.zoom(data, (image_size[0]/data.shape[0], image_size[1]/data.shape[1], 1), order=1)
        return np.expand_dims(resized, axis=0)
    except Exception:
        # Last resort: simple reshape
        resized = np.resize(data, (*image_size, 3))
        return np.expand_dims(resized, axis=0)


@lru_cache(maxsize=1)
def _load_optional_model() -> object | None:
    settings = get_settings()
    raw_model_path = Path(settings.ai_model_path)
    model_path = raw_model_path if raw_model_path.is_absolute() else (settings.project_root / raw_model_path)
    if not model_path.exists():
        if settings.require_trained_ai_model:
            raise FileNotFoundError(
                f"AI model not found at '{model_path}'. Set AI_MODEL_PATH to a valid model file."
            )
        return None
    try:
        import tensorflow as tf

        return tf.keras.models.load_model(model_path)
    except ModuleNotFoundError as exc:
        if exc.name == "tensorflow" and settings.allow_heuristic_ai_fallback:
            logger.warning(
                "TensorFlow is not installed; using heuristic AI fallback because "
                "ALLOW_HEURISTIC_AI_FALLBACK is enabled."
            )
            return None
        if settings.require_trained_ai_model and not settings.allow_heuristic_ai_fallback:
            raise RuntimeError(
                "TensorFlow is required to load the trained AI model but is not installed. "
                "Install it in the backend environment (for example: pip install tensorflow) "
                "or enable ALLOW_HEURISTIC_AI_FALLBACK=true."
            ) from exc
        return None
    except Exception as exc:
        if settings.require_trained_ai_model and not settings.allow_heuristic_ai_fallback:
            raise RuntimeError(f"Failed to load AI model from '{model_path}': {exc}") from exc
        logger.warning("Failed to load trained AI model from '%s'; using heuristic fallback.", model_path)
        return None


class AIInferenceService:
    def predict(self, image: np.ndarray) -> PredictionResult:
        model = _load_optional_model()
        if model is None:
            settings = get_settings()
            if not settings.allow_heuristic_ai_fallback:
                raise RuntimeError(
                    "Heuristic AI fallback is disabled. Configure a trained model via AI_MODEL_PATH."
                )
            return _heuristic_prediction(image)

        probabilities = model.predict(_preprocess_image(image), verbose=0)[0]
        class_index = int(np.argmax(probabilities))
        predicted_class = CLASS_NAMES[class_index]
        
        # Damage probability: sum of moderate + severe damage class probabilities
        damage_probability = float(probabilities[1] + probabilities[2])
        
        # Damaged area percentage: weighted average based on damage class severity
        # Moderate damage (class 1): typically 30-50% area affected, use 40%
        # Severe damage (class 2): typically 70-90% area affected, use 80%
        damaged_area_percentage = float(
            (probabilities[1] * 40.0) + (probabilities[2] * 80.0)
        )
        
        return PredictionResult(
            model_version="cnn-trained-v1",
            predicted_class=predicted_class,
            damage_probability=float(np.clip(damage_probability, 0.0, 1.0)),
            damaged_area_percentage=clamp_percentage(damaged_area_percentage),
            class_probabilities={name: float(prob) for name, prob in zip(CLASS_NAMES, probabilities)},
        )
