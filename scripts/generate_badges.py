import os
import math
import json
from pathlib import Path
from typing import List, Tuple

try:
    import cairosvg  # type: ignore
except Exception:  # pragma: no cover - optional runtime dep
    cairosvg = None

try:
    from PIL import Image, ImageDraw, ImageFont
except Exception:  # pragma: no cover - optional runtime dep
    Image = ImageDraw = ImageFont = None

ROOT = Path(__file__).resolve().parents[1]
SVG_DIR = ROOT / "badges" / "svg"
PNG_DIR = ROOT / "badges" / "png"
SPRITE_PATH = ROOT / "sprites" / "sprite.svg"

BADGES: List[str] = [
    "Human Original",
    "Human Original • AI Polished",
    "Human Written • AI Reviewed",
    "AI Suggested • Human Approved",
    "Human Curated",
    "Human–AI Co-Created",
    "AI Drafted • Human Edited",
    "AI Drafted",
    "AI Generated",
]

LEFT_WIDTH = 44
HEIGHT = 20
RADIUS = 5
PNG_SCALES = {"1x": 1.0, "2x": 2.0}  # label -> scale factor for raster exports
PADDING = 10
CHAR_WIDTH = 7.0  # rough average for the selected typeface
FONT_FAMILY = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
RIGHT_FILL = "#111827"
RIGHT_TEXT = "#E5E7EB"
GRADIENT_START = "#7B5CF9"
GRADIENT_END = "#E549FF"
DARK_STROKE = "#273143"  # slightly lighter gray outline for the dark section
OUTLINE = "#0D1222"
OUTLINE_RGBA = (13, 18, 34, 255)
DARK_GRADIENT_START = "#0f1628"
DARK_GRADIENT_END = "#0b1020"


def slugify(label: str) -> str:
    import re

    slug = label.lower()
    slug = slug.replace("–", "-").replace("—", "-").replace("•", "-").replace("/", "-")
    slug = re.sub(r"[^a-z0-9-]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def text_width(text: str) -> int:
    # Keeps sizing predictable without font lookup.
    return math.ceil(len(text) * CHAR_WIDTH)


def build_svg(label: str) -> str:
    slug = slugify(label)
    right_width = PADDING * 2 + text_width(label)
    total_width = LEFT_WIDTH + right_width
    baseline = 14  # visually centered for 20px height with default font

    sparkle_path = "M9 2l1.1 3.4L13.5 6 10.1 7.6 9 11 7.9 7.6 4.5 6 7.9 5.4 9 2z"

    return f"""
<svg xmlns='http://www.w3.org/2000/svg' width='{total_width}' height='{HEIGHT}' role='img' aria-label='{label}'>
  <title>{label}</title>
  <defs>
    <clipPath id='clip-{slug}'>
      <rect rx='{RADIUS}' width='{total_width}' height='{HEIGHT}' />
    </clipPath>
    <linearGradient id='grad-ai-{slug}' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='{GRADIENT_START}'/>
      <stop offset='100%' stop-color='{GRADIENT_END}'/>
    </linearGradient>
    <linearGradient id='grad-dark-{slug}' x1='0%' y1='0%' x2='0%' y2='100%'>
      <stop offset='0%' stop-color='{DARK_GRADIENT_START}'/>
      <stop offset='100%' stop-color='{DARK_GRADIENT_END}'/>
    </linearGradient>
  </defs>
  <g clip-path='url(#clip-{slug})' shape-rendering='crispEdges'>
    <rect rx='{RADIUS}' width='{total_width}' height='{HEIGHT}' fill='url(#grad-dark-{slug})' stroke='{DARK_STROKE}' stroke-width='1' stroke-linejoin='round' />
    <path d='M {RADIUS} 0 A {RADIUS} {RADIUS} 0 0 0 0 {RADIUS} L 0 {HEIGHT - RADIUS} A {RADIUS} {RADIUS} 0 0 0 {RADIUS} {HEIGHT} L {LEFT_WIDTH} {HEIGHT} L {LEFT_WIDTH} 0 Z' fill='url(#grad-ai-{slug})' stroke='{OUTLINE}' stroke-width='1' stroke-linejoin='round' />
  </g>
  <g fill='none' stroke='rgba(255,255,255,0.08)'>
    <path d='M {LEFT_WIDTH} 1.5 V {HEIGHT - 1.5}'/>
  </g>
  <g>
    <path d='{sparkle_path}' fill='#FDF7FF' transform='translate(8 5) scale(0.6)'/>
    <text x='{LEFT_WIDTH/2 + 4:.1f}' y='{baseline}' text-anchor='middle' fill='#FFFFFF' font-family=\"{FONT_FAMILY}\" font-size='11' font-weight='600'>AI</text>
    <text x='{LEFT_WIDTH + PADDING}' y='{baseline}' fill='{RIGHT_TEXT}' font-family=\"{FONT_FAMILY}\" font-size='11' font-weight='500'>{label}</text>
  </g>
</svg>
"""


def write_svg(label: str, svg: str) -> Path:
    path = SVG_DIR / f"{slugify(label)}.svg"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg, encoding="utf-8")
    return path


def write_png(svg_path: Path, width: int, height: int, label: str, scale_label: str, scale: float) -> Path:
    target_dir = PNG_DIR / scale_label
    target_dir.mkdir(parents=True, exist_ok=True)
    png_path = target_dir / f"{svg_path.stem}.png"

    if cairosvg:
        try:
            cairosvg.svg2png(url=str(svg_path), write_to=str(png_path), output_width=width, output_height=height)
            return png_path
        except Exception:
            print(f"[fallback] cairosvg failed for {svg_path.name}; using Pillow renderer")

    if Image is None:
        print(f"[skip] Pillow not available; PNG not written for {svg_path.name}")
        return png_path

    # Pillow rendering fallback (approximate the SVG look)
    def measure(text: str, font) -> Tuple[int, int]:
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            return bbox[2] - bbox[0], bbox[3] - bbox[1]
        except Exception:
            return font.getsize(text)  # type: ignore[attr-defined]

    def load_font(name: str, size: int, fallback=None):
        fallback = fallback or ImageFont.load_default()
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            try:
                # Try bundled PIL fonts
                from pathlib import Path as _Path

                candidate = _Path(ImageFont.__file__).with_name(name)
                return ImageFont.truetype(candidate, size)
            except Exception:
                return fallback

    scale_factor = height / HEIGHT
    left_px = int(LEFT_WIDTH * scale_factor)
    pad_px = int(PADDING * scale_factor)
    radius = max(2, int(RADIUS * scale_factor))

    # Start with transparent background
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded background for right section with dark gradient
    dark_bg = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    dark_draw = ImageDraw.Draw(dark_bg)
    # Create vertical dark gradient for the right section
    dark_start_r, dark_start_g, dark_start_b = hex_to_rgb(DARK_GRADIENT_START)
    dark_end_r, dark_end_g, dark_end_b = hex_to_rgb(DARK_GRADIENT_END)
    for y in range(height):
        t = y / float(max(height - 1, 1))
        r = int(dark_start_r + (dark_end_r - dark_start_r) * t)
        g = int(dark_start_g + (dark_end_g - dark_start_g) * t)
        b = int(dark_start_b + (dark_end_b - dark_start_b) * t)
        dark_draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
    # Create mask for rounded rectangle
    dark_mask = Image.new("L", (width, height), 0)
    dark_mask_draw = ImageDraw.Draw(dark_mask)
    dark_mask_draw.rounded_rectangle([(0, 0), (width - 1, height - 1)], radius=radius, fill=255)
    img.paste(dark_bg, (0, 0), dark_mask)
    # Draw dark stroke around entire badge
    dark_stroke_rgba = hex_to_rgb(DARK_STROKE) + (255,)
    draw.rounded_rectangle([(0, 0), (width - 1, height - 1)], radius=radius, outline=dark_stroke_rgba, width=1)

    # Gradient for left chip
    start_r, start_g, start_b = hex_to_rgb(GRADIENT_START)
    end_r, end_g, end_b = hex_to_rgb(GRADIENT_END)
    gradient = Image.new("RGBA", (left_px, height))
    g_draw = ImageDraw.Draw(gradient)
    for x in range(left_px):
        t = x / float(max(left_px - 1, 1))
        r = int(start_r + (end_r - start_r) * t)
        g = int(start_g + (end_g - start_g) * t)
        b = int(start_b + (end_b - start_b) * t)
        g_draw.line([(x, 0), (x, height)], fill=(r, g, b, 255))
    mask = Image.new("L", (left_px, height), 0)
    m_draw = ImageDraw.Draw(mask)
    # Square body
    m_draw.rectangle([(radius, 0), (left_px - 1, height - 1)], fill=255)
    m_draw.rectangle([(0, radius), (left_px - 1, height - radius - 1)], fill=255)
    # Rounded left corners only
    m_draw.pieslice([0, 0, radius * 2, radius * 2], 180, 270, fill=255)
    m_draw.pieslice([0, height - radius * 2, radius * 2, height], 90, 180, fill=255)
    img.paste(gradient, (0, 0), mask)
    # Outline on the gradient chip (left rounded, right straight)
    # Draw outline as segments to match the left-rounded shape
    from PIL import ImageDraw as ID
    outline_img = Image.new("RGBA", (left_px, height), (0, 0, 0, 0))
    outline_draw = ID.Draw(outline_img)
    # Create the outline path matching the left-rounded shape
    outline_draw.arc([0, 0, radius * 2, radius * 2], 180, 270, fill=OUTLINE_RGBA, width=1)  # top-left arc
    outline_draw.arc([0, height - radius * 2, radius * 2, height], 90, 180, fill=OUTLINE_RGBA, width=1)  # bottom-left arc
    outline_draw.line([(radius, 0), (left_px - 1, 0)], fill=OUTLINE_RGBA, width=1)  # top edge
    outline_draw.line([(0, radius), (0, height - radius)], fill=OUTLINE_RGBA, width=1)  # left edge
    outline_draw.line([(radius, height - 1), (left_px - 1, height - 1)], fill=OUTLINE_RGBA, width=1)  # bottom edge
    outline_draw.line([(left_px - 1, 0), (left_px - 1, height - 1)], fill=OUTLINE_RGBA, width=1)  # right edge
    img.paste(outline_img, (0, 0), outline_img)

    # Divider
    draw.line([(left_px, 1), (left_px, height - 2)], fill=(255, 255, 255, 20))

    # Sparkle icon
    def star_points(center: Tuple[float, float], outer: float, inner: float) -> List[Tuple[float, float]]:
        cx, cy = center
        pts = []
        for i in range(10):
            angle = math.radians(36 * i - 90)
            r = outer if i % 2 == 0 else inner
            pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
        return pts

    draw.polygon(star_points((6 * scale, height / 2), 3.0 * scale, 1.25 * scale), fill=(253, 247, 255, 255))

    # Text
    # Font sizes tuned for crisp PNG export at 1x/2x; SVGs are primary source of truth.
    ai_font_px = max(14, int(height * 0.70))
    body_font_px = max(14, int(height * 0.68))

    font = load_font("DejaVuSans-Bold.ttf", ai_font_px)

    ai_text = "AI"
    ai_w, ai_h = measure(ai_text, font)
    draw.text(((left_px - ai_w) / 2, (height - ai_h) / 2), ai_text, font=font, fill=(255, 255, 255, 255))

    font_body = load_font("DejaVuSans-Bold.ttf", body_font_px, fallback=font)
    _, text_h = measure(label, font_body)
    draw.text((left_px + pad_px, (height - text_h) / 2), label, font=font_body, fill=(255, 255, 255, 255))

    img.save(png_path)
    return png_path


def build_sprite(svg_paths: List[Path]) -> None:
    symbols = []
    for path in svg_paths:
        svg = path.read_text(encoding="utf-8")
        # Strip outer <svg ...> wrapper
        inner = svg.split("<svg", 1)[1]
        inner = inner.split(">", 1)[1].rsplit("</svg>", 1)[0]
        symbols.append(f"  <symbol id='{path.stem}' viewBox='0 0 {extract_size(svg)[0]} {HEIGHT}'>\n{inner}\n  </symbol>")
    sprite = "\n".join([
        "<svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>",
        *symbols,
        "</svg>",
    ])
    SPRITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    SPRITE_PATH.write_text(sprite, encoding="utf-8")


def extract_size(svg: str) -> (int, int):
    # naive parse of width/height from the <svg ...> header
    import re

    width_match = re.search(r"width='(\d+)'", svg)
    height_match = re.search(r"height='(\d+)'", svg)
    return int(width_match.group(1)), int(height_match.group(1))


def main() -> None:
    svg_paths = []
    for label in BADGES:
        svg = build_svg(label)
        path = write_svg(label, svg)
        svg_paths.append(path)

    for scale_label, scale in PNG_SCALES.items():
        for path, label in zip(svg_paths, BADGES):
            width, _ = extract_size(path.read_text(encoding="utf-8"))
            write_png(path, int(width * scale), int(HEIGHT * scale), label, scale_label, scale)

    build_sprite(svg_paths)

    manifest = {
        "badges": [
            {
                "label": label,
                "slug": slugify(label),
                "path": f"badges/svg/{slugify(label)}.svg",
            }
            for label in BADGES
        ]
    }
    (ROOT / "badges" / "index.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {len(svg_paths)} SVGs, sprite, and manifest.")
    if cairosvg:
        print("PNG exports created (2x).")


if __name__ == "__main__":
    main()
