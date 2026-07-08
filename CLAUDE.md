# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Attribution Badges is a standardized badge system for disclosing AI involvement in content creation. The project generates SVG and PNG badge assets in a shields.io style design, with a purple to magenta gradient "AI" chip on the left and category text on a dark neutral background on the right.

The badges describe process and involvement level. They do not transfer ownership, accountability, or approval.

## Key Commands

### Generate all badge assets

```bash
python -m pip install -r requirements.txt
python scripts/generate_badges.py
```

This is the primary command. It generates:

- Individual SVG files in `badges/svg/`
- PNG exports at 1x (20px) and 2x (40px) in `badges/png/1x/` and `badges/png/2x/`
- A symbol sprite at `sprites/sprite.svg`
- A manifest at `badges/index.json`

The script includes a Pillow based fallback renderer if `cairosvg` is unavailable.

### Alternative PNG export using Node.js and Sharp

```bash
npm install
npm run export:png
```

This reads SVGs from `badges/svg/` and exports PNGs to the same directory structure as the Python script.

### Validate helper JavaScript syntax

```bash
npm run check:node
```

## Architecture

### Badge Categories

Nine badge types ordered by increasing AI involvement are defined in `scripts/generate_badges.py`:

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

- `LEFT_WIDTH = 44`, width of the gradient "AI" chip
- `HEIGHT = 20`, standard badge height at 1x
- `RADIUS = 5`, corner radius
- `PADDING = 10`, horizontal padding around text
- `CHAR_WIDTH = 7.0`, rough character width for layout calculation
- Gradient: `#7B5CF9` to `#E549FF`
- Right section: subtle dark gradient and stroke `#273143`

### Badge Generation Flow

1. `build_svg(label)` constructs SVG string with:
   - Rounded rectangle clipping path
   - Two gradients, left chip and dark background
   - Sparkle icon positioned at x=8 and scaled 0.6x
   - "AI" text centered in left chip
   - Badge label text in right section
2. `write_svg(label, svg)` writes to `badges/svg/{slug}.svg`
3. `write_png(svg_path, width, height, label, scale_label, scale)` exports PNG:
   - Prefers `cairosvg` for crisp rasterization
   - Falls back to Pillow with manual gradient and rounded rectangle rendering
4. `build_sprite(svg_paths)` merges all SVGs into `sprites/sprite.svg` as `<symbol>` elements with IDs matching slugs
5. `build_manifest()` writes `badges/index.json` with label, description, slug, SVG path, and PNG paths

### Interactive Demo Page

`index.html` is a single-file static site with:

- Interactive picker to generate embed snippets for Markdown, HTML, email footer, PNG, SVG, and sprite `<use>`
- Copy-to-clipboard buttons for code, PNG, and SVG
- Cache-busting query param `ASSET_VERSION`
- Runtime loading from `badges/index.json`, with a static fallback array for local/offline resilience
- PNG first email footer output for better Outlook compatibility
- Live usage counter with a fallback value if the analytics API is unavailable

## File Structure

```text
.
├── .github/workflows/
│   └── validate-assets.yml       # CI asset validation
├── api/
│   ├── badge-count.js            # Vercel style GA4 badge count endpoint
│   ├── cloudflare-worker.js      # Cloudflare Worker GA4 badge count endpoint
│   └── README.md                 # Badge counter API setup notes
├── badges/
│   ├── svg/                      # Individual SVG badges
│   ├── png/
│   │   ├── 1x/                   # 20px tall PNGs
│   │   └── 2x/                   # 40px tall PNGs for HiDPI rendering
│   └── index.json                # Manifest used by the demo page
├── sprites/
│   └── sprite.svg                # Combined symbol sprite for <use> references
├── scripts/
│   ├── generate_badges.py        # Main badge generator
│   └── export_png.js             # Alternative PNG export via Sharp
├── index.html                    # Interactive demo and embed helper
├── package.json                  # Node helper scripts and Sharp dependency
├── requirements.txt              # Python generation dependencies
├── .nojekyll                     # Disables Jekyll processing for GitHub Pages
└── README.md                     # User-facing documentation
```

## Important Notes

- Keep badge definitions in `scripts/generate_badges.py` and regenerate assets after any label or description change.
- The demo page reads `badges/index.json` at runtime so the picker and badge grid stay aligned with the generated assets.
- Slugs are generated via `slugify()` which converts separators such as `–`, `•`, and `/` to `-` and removes non-alphanumeric characters.
- Badge labels are SVG escaped before being written to `aria-label`, `<title>`, and `<text>` values.
- PNG rendering depends on optional dependencies (`cairosvg`, `Pillow`, or `sharp`).
- Increment `ASSET_VERSION` in `index.html` after regenerating badge visuals or manifest fields.
- CI runs the Python generator and fails if generated `badges/` or `sprites/` assets are not committed.
