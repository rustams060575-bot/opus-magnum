"""Convert the raw Figma exports in assets-src/ to optimized, semantically named WebP files in public/img/.
Usage: python scripts/optimize_images.py
"""
from pathlib import Path
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "assets-src"
OUT = Path(__file__).resolve().parent.parent / "public" / "img"
OUT.mkdir(parents=True, exist_ok=True)

# raw file -> (public name, max long edge, quality)
MAP = {
    "title_1": ("title-parchment", 1600, 80),
    "heart1_1": ("smoke", 1600, 70),
    "heart1_3": ("heart-chained", 1280, 84),
    "heart2_4": ("heart-caged", 1280, 84),
    "s1_3": ("nigredo-parchment", 1280, 80),
    "s1_2": ("nigredo-book", 1280, 84),
    "d4_1": ("heart-lava", 1280, 84),
    "d19_1": ("crescent", 1280, 78),
    "d19_3": ("heart-stone", 1280, 84),
    "f13_1": ("heart-hall", 1280, 84),
    "s2_4": ("foil", 1280, 76),
    "s2_2": ("yinyang", 1280, 82),
    "s2_6": ("face", 1280, 84),
    "f4_1": ("heart-fire", 1280, 84),
    "f7_1": ("heart-gold", 1280, 84),
    "f8_1": ("heart-flowers", 1280, 84),
    "s3_2": ("grunge", 1280, 76),
    "s3_3": ("hands", 1280, 84),
    "s3_4": ("heart-green", 1280, 84),
    "s4_1": ("mountain", 1600, 82),
    "s5_1": ("star", 1280, 82),
    "s5_3": ("horizon-blue", 1280, 80),
    "s6_1": ("void-flare", 1280, 80),
    "s7_1": ("mandala", 1280, 86),
}

total = 0
for raw, (name, edge, q) in MAP.items():
    p = SRC / f"{raw}.jpg"
    if not p.exists():
        print("missing", raw)
        continue
    im = Image.open(p).convert("RGB")
    w, h = im.size
    s = min(1.0, edge / max(w, h))
    if s < 1:
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    dst = OUT / f"{name}.webp"
    im.save(dst, "WEBP", quality=q, method=6)
    total += dst.stat().st_size
    print(f"{name:20s} {im.size[0]}x{im.size[1]}  {dst.stat().st_size//1024} KB")
print("total", total // 1024, "KB")
