# AI Attribution Badges

A small, standardized badge set for disclosing how AI was used in content creation. Badges describe the **process** used to create an artifact, not ownership, approval, or accountability.

## What this is for

Use these badges when you want a quick, professional way to show colleagues, stakeholders, or customers how AI contributed to a piece of work.

Good fits include:

- Emails and customer replies
- Reports, one-pagers, and FAQs
- Slide decks and meeting materials
- Campaign briefs and internal comms
- Web pages, docs, and knowledge base articles

## Badge Categories

Ordered by increasing AI involvement:

| Badge | Meaning |
| --- | --- |
| Human Original | Created without AI assistance. |
| Human Original • AI Polished | Human wrote it. AI only refined grammar, tone, or clarity. |
| Human Written • AI Reviewed | Human authored it. AI was used for review or quality checks only. |
| AI Suggested • Human Approved | AI proposed options. A human selected and lightly adjusted them. |
| Human Curated | Human selected, arranged, or evaluated AI outputs from multiple candidates. |
| Human–AI Co-Created | Human and AI collaborated iteratively on ideas, structure, and wording. |
| AI Drafted • Human Edited | AI produced the first draft. A human substantively edited or fact-checked it. |
| AI Drafted | AI produced the first draft with minimal human edits. |
| AI Generated | AI produced the final artifact with no meaningful human edits. |

## Which badge should I use?

Start with the highest level of AI involvement that occurred.

- No AI was used: **Human Original**
- AI cleaned up human-written text: **Human Original • AI Polished**
- AI reviewed but did not write: **Human Written • AI Reviewed**
- AI gave options and a human chose: **AI Suggested • Human Approved**
- AI created multiple outputs and a human assembled the final version: **Human Curated**
- Human and AI worked back and forth throughout: **Human–AI Co-Created**
- AI wrote the first draft and a human meaningfully edited it: **AI Drafted • Human Edited**
- AI wrote the first draft and edits were light: **AI Drafted**
- AI produced the final result with little or no human change: **AI Generated**

When unsure, default to **Human–AI Co-Created**.

## Design System

- Shields.io style pill shape with rounded corners.
- Left chip reads `AI` on a purple to magenta gradient and includes a small sparkle icon to signal AI assistance.
- Right chip carries the category text on a neutral ink background for contrast.
- Typeface: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif fallback.
- Default size: 20px tall.
- Vector assets scale without loss.

## Assets

Generated assets live under `badges/`:

- `badges/svg/` contains individual SVGs.
- `badges/png/1x/` contains PNG exports at 20px tall.
- `badges/png/2x/` contains PNG exports at 40px tall for HiDPI use.
- `badges/index.json` contains the badge manifest used by the demo page.
- `sprites/sprite.svg` contains a symbol sprite for inlining `<use>` references.

## Quick Start

```sh
python -m pip install -r requirements.txt
python scripts/generate_badges.py
```

Optional Node based PNG export:

```sh
npm install
npm run export:png
```

## Embedding Examples

Markdown using SVG:

```md
![Human–AI Co-Created](badges/svg/human-ai-co-created.svg)
```

Markdown using PNG:

```md
![Human–AI Co-Created](badges/png/1x/human-ai-co-created.png)
```

HTML image using HiDPI PNG rendered at 20px:

```html
<img
  src="badges/png/1x/human-ai-co-created.png"
  srcset="badges/png/2x/human-ai-co-created.png 2x"
  alt="Human–AI Co-Created"
  height="20">
```

HTML sprite:

```html
<svg role="img" aria-label="AI Suggested • Human Approved" width="220" height="20">
  <use href="sprites/sprite.svg#ai-suggested-human-approved" />
</svg>
```

Shields.io fallback:

```text
https://img.shields.io/badge/AI-Suggested%E2%80%A2Human%20Approved-6B7280?logo=sparkles&logoColor=white&labelColor=7B5CF9
```

## Development

The badge definitions live in `scripts/generate_badges.py`. Running the generator exports the SVGs, PNGs, sprite, and `badges/index.json` manifest. The demo page reads `badges/index.json` at runtime so the picker and badge grid stay aligned with the generated assets.

## License

MIT for code; badges may be used and embedded without attribution.
