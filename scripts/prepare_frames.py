"""Builds full-bleed heart frames for the interludes.

Inputs (kept locally in assets-src/figma/, not committed):
  Frame 1/2/3/9/10.jpg  — exported frames (3840x2000)
  Group 5.jpg           — the whole Figma page; other frames are cropped from it
Outputs: public/img/frames/*.webp (2400 px wide) and src/scenes/frames.json (edge colour per frame).

Usage: python scripts/prepare_frames.py
"""
import json
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "figma"
OUT = ROOT / "public" / "img" / "frames"
OUT.mkdir(parents=True, exist_ok=True)

# the Group 5 export is the 3922x18096 Figma group at 1.8108x; group origin is (-93, -438)
GROUP = Image.open(SRC / "Group 5.jpg").convert("RGB")
S = GROUP.width / 3922
def crop(x, y):
    x0, y0 = round((x + 93) * S), round((y + 438) * S)
    return GROUP.crop((x0, y0, x0 + round(1920 * S), y0 + round(1000 * S)))

frames = {
    # name: image
    "h1-chained": crop(-93, 619),
    "h1-caged": crop(1909, 619),
    "h2-lava": crop(-93, 2732),
    "h3-hall": crop(-93, 4829),
    "h3-gold": crop(1909, 4829),
    "h4-fire": Image.open(SRC / "Frame 1.jpg"),
    "h4-book": Image.open(SRC / "Frame 2.jpg"),
    "h5-ecg": Image.open(SRC / "Frame 3.jpg"),
    "h5-flame": crop(1909, 9111),
    "h6-lapis": crop(-93, 11253),
    "h6-blue": crop(1909, 11253),
    "h7-white": crop(-93, 13423),
    "h7-flowers": crop(1909, 13423),
    "h8-hands-a": Image.open(SRC / "Frame 9.jpg"),
    "h8-hands-b": Image.open(SRC / "Frame 10.jpg"),
}

meta = {}
for name, im in frames.items():
    im = im.convert("RGB")
    w = 2400
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", "WEBP", quality=80, method=6)
    # dominant edge colour: median of a thin border ring
    px = im.load()
    ring = []
    for x in range(0, im.width, 12):
        ring += [px[x, 2], px[x, im.height - 3]]
    for y in range(0, im.height, 12):
        ring += [px[2, y], px[im.width - 3, y]]
    ring.sort(key=lambda c: sum(c))
    r, g, b = ring[len(ring) // 2]
    meta[name] = {"bg": f"#{r:02x}{g:02x}{b:02x}", "w": im.width, "h": im.height}
    print(f"{name:12s} {im.size}  bg {meta[name]['bg']}  {(OUT / f'{name}.webp').stat().st_size // 1024} KB")

(ROOT / "src" / "scenes" / "frames.json").write_text(json.dumps(meta, indent=2))
