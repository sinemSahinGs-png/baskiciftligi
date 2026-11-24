"""Build transparent WebP cutouts for the portal vase and wholesale dragon."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "images" / "home-industrial"
OUT = SRC


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def key_dark(image: Image.Image, solid: float = 14.0, feather: float = 28.0) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            red, green, blue, _alpha = pixels[x, y]
            luma = luminance(red, green, blue)
            if luma <= solid:
                alpha = 0
            elif luma >= solid + feather:
                alpha = 255
            else:
                alpha = int(255 * (luma - solid) / feather)
            pixels[x, y] = (red, green, blue, alpha)
    return rgba


def key_light(image: Image.Image, solid: float = 248.0, feather: float = 18.0) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            red, green, blue, _alpha = pixels[x, y]
            luma = luminance(red, green, blue)
            if luma >= solid:
                alpha = 0
            elif luma <= solid - feather:
                alpha = 255
            else:
                alpha = int(255 * (solid - luma) / feather)
            pixels[x, y] = (red, green, blue, alpha)
    return rgba


def opaque_bbox(image: Image.Image, threshold: int = 18) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    extrema = alpha.getbbox()
    if extrema is None:
        return (0, 0, image.width, image.height)
    left, top, right, bottom = extrema
    # tighten using threshold
    data = alpha.load()
    min_x, min_y, max_x, max_y = right, bottom, left, top
    for y in range(top, bottom):
        for x in range(left, right):
            if data[x, y] > threshold:
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y
    pad = 12
    return (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(image.width, max_x + 1 + pad),
        min(image.height, max_y + 1 + pad),
    )


def place(image: Image.Image, canvas: tuple[int, int], foot: float = 0.08) -> Image.Image:
    sheet = Image.new("RGBA", canvas, (0, 0, 0, 0))
    box = opaque_bbox(image)
    cropped = image.crop(box)
    max_w = int(canvas[0] * 0.78)
    max_h = int(canvas[1] * 0.86)
    scale = min(max_w / cropped.width, max_h / cropped.height)
    size = (max(1, int(cropped.width * scale)), max(1, int(cropped.height * scale)))
    fitted = cropped.resize(size, Image.Resampling.LANCZOS)
    x = (canvas[0] - fitted.width) // 2
    y = canvas[1] - fitted.height - int(canvas[1] * foot)
    sheet.alpha_composite(fitted, (x, y))
    return sheet


def save_webp(image: Image.Image, name: str) -> None:
    path = OUT / name
    image.save(path, "WEBP", quality=92, method=6)
    print(f"wrote {path.relative_to(ROOT)} {image.size}")


def main() -> None:
    wire = key_dark(Image.open(SRC / "hero-wireframe-vase.png"), solid=12, feather=26)
    finish = key_light(Image.open(SRC / "featured-product.png"), solid=247, feather=16)
    dragon = key_dark(Image.open(SRC / "archive-main.png"), solid=18, feather=16)

    vase_canvas = (900, 1180)
    save_webp(place(wire, vase_canvas, foot=0.09), "portal-vase-wire.webp")
    save_webp(place(finish, vase_canvas, foot=0.09), "portal-vase-finish.webp")

    dbox = opaque_bbox(dragon)
    dragon_crop = dragon.crop(dbox)
    save_webp(dragon_crop, "wholesale-dragon-cutout.webp")


if __name__ == "__main__":
    main()
