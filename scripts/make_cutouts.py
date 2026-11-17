"""Cuts every heart out of its Figma frame so the hearts can be layered.

For each frame in public/img/frames/ it writes
  public/img/cut/<name>.webp   the heart alone, transparent, trimmed to its bounding box
  public/img/bg/<name>.webp    a heavily blurred, darkened copy of the whole frame (ambient light behind the heart)
and records the geometry in src/scenes/cutouts.json. The hero heart also gets a "crack glow" layer.

Requires: pip install rembg onnxruntime pillow numpy   (downloads the isnet model on first run)
Usage:    python scripts/make_cutouts.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
FR = ROOT / "public" / "img" / "frames"
CUT = ROOT / "public" / "img" / "cut"
BG = ROOT / "public" / "img" / "bg"
CUT.mkdir(parents=True, exist_ok=True)
BG.mkdir(parents=True, exist_ok=True)

# frames with a photographic background (clouds, hands) are not cut: they stay full-bleed
SKIP = {"h8-hands-a", "h8-hands-b"}
session = new_session("isnet-general-use")
meta = {}


def trim(im: Image.Image, pad: float = 0.02):
    a = np.array(im.split()[-1])
    ys, xs = np.where(a > 24)
    if len(xs) == 0:
        return im, (0, 0, im.width, im.height)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    px, py = int((x1 - x0) * pad), int((y1 - y0) * pad)
    box = (max(0, x0 - px), max(0, y0 - py), min(im.width, x1 + px), min(im.height, y1 + py))
    return im.crop(box), box


for f in sorted(FR.glob("*.webp")):
    name = f.stem
    src = Image.open(f).convert("RGB")
    # ambient background: tiny, blurred, darkened
    bg = src.resize((960, round(src.height * 960 / src.width)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(26))
    bg = Image.eval(bg, lambda v: int(v * 0.72))
    bg.save(BG / f"{name}.webp", "WEBP", quality=70, method=6)
    if name in SKIP:
        continue
    work = src.resize((1600, round(src.height * 1600 / src.width)), Image.LANCZOS)
    out = remove(work, session=session, alpha_matting=False, post_process_mask=True)
    out, box = trim(out)
    scale = src.width / work.width
    # heart centre and size as fractions of the full frame
    cx = (box[0] + box[2]) / 2 * scale / src.width
    cy = (box[1] + box[3]) / 2 * scale / src.height
    hh = (box[3] - box[1]) * scale / src.height
    out.save(CUT / f"{name}.webp", "WEBP", quality=88, method=6)
    meta[name] = {"cx": round(cx, 4), "cy": round(cy, 4), "h": round(hh, 4), "ar": round(out.width / out.height, 4)}
    print(f"{name:12s} cx {cx:.2f} cy {cy:.2f} h {hh:.2f} ar {out.width / out.height:.2f}")

# ---- hero heart (from the raw lava-heart photo) + a glow layer made of its cracks
raw = ROOT / "assets-src" / "d4_1.jpg"
if raw.exists():
    im = Image.open(raw).convert("RGB")
    cut = remove(im, session=session, post_process_mask=True)
    cut, box = trim(cut, 0.01)
    cut.save(CUT / "hero-heart.webp", "WEBP", quality=90, method=6)
    arr = np.array(cut).astype(np.float32)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3] / 255
    heat = np.clip((r - 150) / 80, 0, 1) * np.clip((r - g * 1.15) / 70, 0, 1) * a
    glow = np.zeros((*heat.shape, 4), np.uint8)
    glow[..., 0] = 255
    glow[..., 1] = np.clip(120 + 100 * heat, 0, 255)
    glow[..., 2] = 40
    glow[..., 3] = np.clip(heat * 255, 0, 255)
    g_im = Image.fromarray(glow, "RGBA")
    soft = g_im.filter(ImageFilter.GaussianBlur(10))
    soft2 = g_im.filter(ImageFilter.GaussianBlur(34))
    combo = Image.alpha_composite(soft2, soft)
    combo.save(CUT / "hero-heart-glow.webp", "WEBP", quality=85, method=6)
    meta["hero-heart"] = {"ar": round(cut.width / cut.height, 4)}
    print("hero heart", cut.size)

(ROOT / "src" / "scenes" / "cutouts.json").write_text(json.dumps(meta, indent=2))
print("done")
