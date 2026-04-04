from __future__ import annotations

import math
import re
from datetime import date, datetime, timedelta
from io import BytesIO
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np


def parse_damage_date(value: date | datetime | str) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    return datetime.strptime(str(value), "%Y-%m-%d")


def get_date_ranges(
    damage_date: str | date | datetime,
    gap_before: int = 5,
    gap_after: int = 5,
    window_days: int = 10,
) -> tuple[str, str, str, str]:
    parsed = parse_damage_date(damage_date)
    before_start = (parsed - timedelta(days=gap_before + window_days)).strftime("%Y-%m-%d")
    before_end = (parsed - timedelta(days=gap_before)).strftime("%Y-%m-%d")
    after_start = (parsed + timedelta(days=gap_after)).strftime("%Y-%m-%d")
    after_end = (parsed + timedelta(days=gap_after + window_days)).strftime("%Y-%m-%d")
    return before_start, before_end, after_start, after_end


def clamp_percentage(value: float) -> float:
    return float(np.clip(value, 0.0, 100.0))


def point_buffer_meters(area_hectares: float) -> float:
    safe_area = max(area_hectares, 0.5)
    area_sq_m = safe_area * 10000.0
    radius = np.sqrt(area_sq_m / np.pi)
    return float(max(radius, 180.0))


def normalize_rgb(image: np.ndarray) -> np.ndarray:
    image = image.astype(np.float32)
    valid = image[np.isfinite(image) & (image > 0.0)]
    if valid.size == 0:
        return np.zeros_like(np.nan_to_num(image, nan=0.0), dtype=np.float32)

    low = float(np.percentile(valid, 2))
    high = float(np.percentile(valid, 98))
    if high <= low:
        high = low + 1.0
    safe = np.nan_to_num(image, nan=0.0)
    return np.clip((safe - low) / (high - low), 0.0, 1.0)


def enhance_image(image: np.ndarray, upscale_factor: int = 2) -> np.ndarray:
    data = image.astype(np.float32)
    if data.max() > 1.0:
        data = data / 255.0

    upscale_factor = max(1, int(upscale_factor))
    if upscale_factor == 1:
        upscaled = data
    else:
        target_h = data.shape[0] * upscale_factor
        target_w = data.shape[1] * upscale_factor
        try:
            import tensorflow as tf

            resized = tf.image.resize(data, [target_h, target_w], method="bicubic", antialias=True)
            upscaled = resized.numpy().astype(np.float32)
        except Exception:
            upscaled = np.repeat(np.repeat(data, upscale_factor, axis=0), upscale_factor, axis=1)

    enhanced = np.zeros_like(upscaled, dtype=np.float32)
    for channel in range(upscaled.shape[2]):
        current = upscaled[..., channel]
        low, high = np.percentile(current, (1, 99))
        if high > low:
            current = np.clip((current - low) / (high - low), 0.0, 1.0)

        padded = np.pad(current, 1, mode="edge")
        blur = (
            padded[:-2, :-2]
            + padded[:-2, 1:-1]
            + padded[:-2, 2:]
            + padded[1:-1, :-2]
            + padded[1:-1, 1:-1]
            + padded[1:-1, 2:]
            + padded[2:, :-2]
            + padded[2:, 1:-1]
            + padded[2:, 2:]
        ) / 9.0
        sharpened = current + 0.35 * (current - blur)
        enhanced[..., channel] = np.clip(sharpened, 0.0, 1.0)
    return enhanced


def fig_to_png_bytes(fig: Any) -> bytes:
    buffer = BytesIO()
    fig.savefig(buffer, format="png", dpi=180, bbox_inches="tight")
    plt.close(fig)
    buffer.seek(0)
    return buffer.getvalue()


def array_to_png_bytes(
    image: np.ndarray,
    title: str | None = None,
    cmap: str | None = None,
    figsize: tuple[float, float] = (4.5, 4.5),
    dpi: int = 180,
    interpolation: str = "nearest",
) -> bytes:
    fig, ax = plt.subplots(figsize=figsize)
    if cmap:
        ax.imshow(image, cmap=cmap, interpolation=interpolation)
    else:
        ax.imshow(image, interpolation=interpolation)
    if title:
        ax.set_title(title)
    ax.axis("off")
    buffer = BytesIO()
    fig.savefig(buffer, format="png", dpi=dpi, bbox_inches="tight")
    plt.close(fig)
    buffer.seek(0)
    return buffer.getvalue()


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _web_mercator_to_lat_lon(x: float, y: float) -> tuple[float, float]:
    radius = 6378137.0
    lon = (x / radius) * (180.0 / math.pi)
    lat = (2.0 * math.atan(math.exp(y / radius)) - math.pi / 2.0) * (180.0 / math.pi)
    return lat, lon


def extent_to_polygon_lat_lon(extent: list[float]) -> list[list[float]]:
    if len(extent) != 4:
        return []
    min_x, min_y, max_x, max_y = extent
    corners = [
        (min_x, min_y),
        (max_x, min_y),
        (max_x, max_y),
        (min_x, max_y),
        (min_x, min_y),
    ]
    uses_degrees = (
        -180.0 <= min_x <= 180.0
        and -180.0 <= max_x <= 180.0
        and -90.0 <= min_y <= 90.0
        and -90.0 <= max_y <= 90.0
    )
    polygon: list[list[float]] = []
    for x, y in corners:
        if uses_degrees:
            polygon.append([float(y), float(x)])
        else:
            lat, lon = _web_mercator_to_lat_lon(float(x), float(y))
            polygon.append([lat, lon])
    return polygon


def polygon_centroid(polygon: list[list[float]]) -> tuple[float, float]:
    if not polygon:
        return 18.5204, 73.8567
    points = polygon[:-1] if len(polygon) > 1 and polygon[0] == polygon[-1] else polygon
    if not points:
        return 18.5204, 73.8567
    lat = sum(p[0] for p in points) / len(points)
    lon = sum(p[1] for p in points) / len(points)
    return float(lat), float(lon)


def parse_area_hectares(area_values: list[str], default: float = 2.5) -> float:
    for raw in area_values:
        text = raw.strip().lower().replace(",", "")
        match = re.search(r"(-?\d+(?:\.\d+)?)", text)
        if not match:
            continue
        value = float(match.group(1))
        if value <= 0:
            continue
        if "sq m" in text or "sqm" in text or "m2" in text:
            value = value / 10000.0
        return float(max(value, 0.1))
    return float(max(default, 0.1))
