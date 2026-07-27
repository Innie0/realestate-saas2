#!/usr/bin/env python3
"""Generate mesh WebP variants from the Instantly-style cobalt reference."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MESH_DIR = ROOT / "public" / "landing" / "mesh"
SIZES = (500, 800, 1080, 1600, 1920)

# Hue shift (degrees) + saturation/value multipliers tuned to marketing CSS tokens
VARIANTS: dict[str, dict[str, float]] = {
    "mesh-cobalt": {"hue": 0, "sat": 1.0, "val": 1.0},
    "mesh-violet": {"hue": 52, "sat": 1.06, "val": 0.98},
    "mesh-teal": {"hue": -58, "sat": 1.02, "val": 0.96},
    "mesh-plum": {"hue": 72, "sat": 1.1, "val": 0.97},
    "mesh-emerald": {"hue": -68, "sat": 0.98, "val": 0.95},
}


def shift_hue(img: Image.Image, hue_deg: float, sat_mult: float, val_mult: float) -> Image.Image:
    hsv = img.convert("HSV")
    h, s, v = hsv.split()

    hue_offset = int(round((hue_deg / 360) * 255)) % 256
    h = h.point(lambda p: (p + hue_offset) % 256)

    if sat_mult != 1.0:
        s = s.point(lambda p: min(255, int(p * sat_mult)))

    if val_mult != 1.0:
        v = v.point(lambda p: min(255, int(p * val_mult)))

    return Image.merge("HSV", (h, s, v)).convert("RGB")


def main() -> None:
    MESH_DIR.mkdir(parents=True, exist_ok=True)

    for size in SIZES:
        source = MESH_DIR / f"hero-cobalt-{size}.webp"
        if not source.exists():
            raise SystemExit(f"Missing reference: {source}")

        base = Image.open(source).convert("RGB")

        for name, params in VARIANTS.items():
            if name == "mesh-cobalt" and params["hue"] == 0:
                out = base.copy()
            else:
                out = shift_hue(base, params["hue"], params["sat"], params["val"])

            dest = MESH_DIR / f"{name}-{size}.webp"
            out.save(dest, "WEBP", quality=88, method=6)
            print(f"Wrote {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
