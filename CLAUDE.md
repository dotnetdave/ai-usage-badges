# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Attribution Badges is a standardized badge system for disclosing AI involvement in content creation. The project generates SVG and PNG badge assets in a shields.io-style design, with a purple-to-magenta gradient "AI" chip on the left and category text on a dark neutral background on the right.

## Key Commands

### Generate all badge assets
```bash
python scripts/generate_badges.py
```
This is the primary command. It generates:
- Individual SVG files in `badges/svg/`
- PNG exports at 1x (20px) and 2x (40px) in `badges/png/1x/` and `badges/png/2x/`
- A symbol sprite at `sprites/sprite.svg`
- A manifest at `badges/index.json`

The script includes a Pillow-based fallback renderer if `cairosvg` is unavailable.

### Alternative PNG export (Node.js + Sharp)
```bash
node scripts/export_png.js
```
This requires `sharp` to be installed (`npm install sharp`). It reads SVGs from `badges/svg/` and exports PNGs to the same directory structure as the Python script.

## Architecture

### Badge Categories
Nine badge types ordered by increasing AI involvement (defined in `scripts/generate_badges.py:BADGES`):
1. Human Original
2. Human Original • AI Polished
3. Human Written • AI Reviewed
4. AI Suggested • Human Approved
5. Human Curated
6. Human–AI Co-Created
7. AI Drafted • Human Edited
8. AI Drafted
9. AI Generated

### Design Constants
Located in `scripts/generate_badges.py`:
- `LEFT_WIDTH = 44` — width of the gradient "AI" chip
- `HEIGHT = 20` — standard badge height (1x)
- `RADIUS = 5` — corner radius
- `PADDING = 10` — horizontal padding around text
- `CHAR_WIDTH = 7.0` — rough character width for layout calculation
- Gradient: `#7B5CF9` → `#E549FF`
- Right section: dark fill `#111827` with subtle dark gradient and stroke `#273143`

### Badge Generation Flow
1. **`build_svg(label)`** — constructs SVG string with:
   - Rounded rectangle clipping path
   - Two gradients (left chip and dark background)
   - Sparkle icon positioned at x=8, scaled 0.6x
   - "AI" text centered in left chip
   - Badge label text in right section
2. **`write_svg(label, svg)`** — writes to `badges/svg/{slug}.svg`
3. **`write_png(svg_path, width, height, label, scale_label, scale)`** — exports PNG:
   - Prefers `cairosvg` for crisp rasterization
   - Falls back to Pillow with manual gradient/rounded rect rendering
4. **`build_sprite(svg_paths)`** — merges all SVGs into `sprites/sprite.svg` as `<symbol>` elements with IDs matching slugs

### Interactive Demo Page
`index.html` is a single-file static site with:
- Hardcoded badge list matching `scripts/generate_badges.py:BADGES`
- Interactive picker to generate embed snippets (Markdown, HTML, email footer, sprite `<use>`)
- Copy-to-clipboard buttons for code, PNG, and SVG
- Cache-busting query param `ASSET_VERSION = "v3"` applied via `withV(path)`

The page is styled with a dark gradient background, custom CSS variables, and responsive grid layouts. It uses Google Fonts (Manrope, Space Grotesk) and inline JavaScript for all interactivity.

## File Structure

```
.
├── badges/
│   ├── svg/           # Individual SVG badges
│   ├── png/
│   │   ├── 1x/        # 20px tall PNGs
│   │   └── 2x/        # 40px tall PNGs (HiDPI)
│   └── index.json     # Manifest with label, slug, path for each badge
├── sprites/
│   └── sprite.svg     # Combined symbol sprite for <use> references
├── scripts/
│   ├── generate_badges.py  # Main badge generator (SVG + PNG + sprite + manifest)
│   └── export_png.js       # Alternative PNG export via Sharp
├── index.html         # Interactive demo and embed helper
├── .nojekyll          # Disables Jekyll processing for GitHub Pages
└── README.md          # User-facing documentation
```

## Important Notes

- The badge list must be kept in sync between `scripts/generate_badges.py:BADGES` and `index.html` (JavaScript `badges` array at line 370).
- Slugs are generated via `slugify()` which converts `–`, `—`, `•`, `/` to `-` and removes non-alphanumeric characters.
- The SVG uses `shape-rendering='crispEdges'` for sharp rendering; text uses the system font stack defined in `FONT_FAMILY`.
- PNG rendering depends on optional dependencies (`cairosvg`, `Pillow`, or `sharp`). The Python script gracefully degrades.
- The demo page appends `?v={ASSET_VERSION}` to all asset URLs to bust caches when designs change. Increment `ASSET_VERSION` in `index.html` after regenerating badges.
- Git status shows `index.html` as modified. Recent commits focus on stroke and gradient adjustments to the badge design.
