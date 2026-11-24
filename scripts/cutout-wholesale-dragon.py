"""Crop the display pedestal and grade the wholesale dragon into cave light."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "images" / "home-industrial"
OUT = SRC / "wholesale-dragon-embed.webp"


def luma(rgb: np.ndarray) -> np.ndarray:
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def key_dark(image: Image.Image) -> np.ndarray:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    value = luma(rgb)
    alpha = np.clip((value - 16.0) / 18.0, 0.0, 1.0) * 255.0
    rgba = np.dstack((rgb, alpha)).astype(np.uint8)
    return rgba


def local_std(channel: np.ndarray, radius: int = 3) -> np.ndarray:
    padded = np.pad(channel, radius, mode="edge")
    window = (2 * radius + 1) ** 2
    total = np.zeros_like(channel, dtype=np.float64)
    total_sq = np.zeros_like(channel, dtype=np.float64)
    for dy in range(2 * radius + 1):
        for dx in range(2 * radius + 1):
            tile = padded[dy : dy + channel.shape[0], dx : dx + channel.shape[1]]
            total += tile
            total_sq += tile * tile
    mean = total / window
    var = np.maximum(total_sq / window - mean * mean, 0.0)
    return np.sqrt(var)


def opaque_bbox(alpha: np.ndarray, threshold: int = 20) -> tuple[int, int, int, int]:
    ys, xs = np.where(alpha > threshold)
    pad = 8
    left = max(0, int(xs.min()) - pad)
    top = max(0, int(ys.min()) - pad)
    right = min(alpha.shape[1], int(xs.max()) + 1 + pad)
    bottom = min(alpha.shape[0], int(ys.max()) + 1 + pad)
    return left, top, right, bottom


def strip_pedestal(rgba: np.ndarray) -> np.ndarray:
    cut = 878
    rgba[cut:, :, 3] = 0
    fade = np.linspace(1.0, 0.0, 22, dtype=np.float32)
    rgba[cut - 22 : cut, :, 3] = (
        rgba[cut - 22 : cut, :, 3].astype(np.float32) * fade[:, None]
    ).astype(np.uint8)
    gray = luma(rgba[..., :3].astype(np.float32))
    std = local_std(gray, radius=3)
    yy, xx = np.mgrid[0 : rgba.shape[0], 0 : rgba.shape[1]]
    wings = ((xx < 455) | (xx > 1095)) & (yy > 820) & (std < 16)
    rgba[..., 3] = np.where(wings, 0, rgba[..., 3])
    mask = Image.fromarray(rgba[..., 3], mode="L").filter(ImageFilter.GaussianBlur(1.2))
    rgba[..., 3] = np.asarray(mask)
    left, top, right, bottom = opaque_bbox(rgba[..., 3])
    return rgba[top:bottom, left:right].copy()


def grade_cave(rgba: np.ndarray) -> np.ndarray:
    height, width = rgba.shape[:2]
    xx = np.linspace(0, 1, width, dtype=np.float32)
    yy = np.linspace(0, 1, height, dtype=np.float32)
    grid_x, grid_y = np.meshgrid(xx, yy)
    rgb = rgba[..., :3].astype(np.float32)
    value = luma(rgb) / 255.0
    compressed = 0.40 + value * 0.38
    champagne = np.array([198.0, 166.0, 118.0], dtype=np.float32)
    copper = np.array([154.0, 96.0, 52.0], dtype=np.float32)
    bounce = np.clip((grid_x - 0.36) * 0.38, 0, 1) * np.clip((grid_y - 0.18) * 0.62, 0, 1)
    bounce = bounce[..., None]
    mixed = rgb * 0.46 + champagne * 0.54
    graded = mixed * compressed[..., None] + copper * bounce * 0.62
    graded[..., 0] = np.clip(graded[..., 0], 28, 176)
    graded[..., 1] = np.clip(graded[..., 1], 20, 148)
    graded[..., 2] = np.clip(graded[..., 2], 12, 98)
    rgba[..., :3] = graded.astype(np.uint8)
    return rgba


def main() -> None:
    rgba = key_dark(Image.open(SRC / "archive-main.png"))
    rgba = strip_pedestal(rgba)
    rgba = grade_cave(rgba)
    alpha = rgba[..., 3]
    left, top, right, bottom = opaque_bbox(alpha, threshold=12)
    trimmed = Image.fromarray(rgba[top:bottom, left:right], mode="RGBA")
    trimmed.save(OUT, "WEBP", quality=92, method=6)
    print(f"wrote {OUT.relative_to(ROOT)} {trimmed.size}")


if __name__ == "__main__":
    main()
