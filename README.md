# AI Usage Badges

A small, standardized badge set for disclosing how AI was used in content creation. Badges describe the **process** (who/what contributed), not ownership or accountability.

## Badge Categories (ordered by increasing AI involvement)
- Human Original
- Human Original • AI Polished
- Human Written • AI Reviewed
- AI Suggested • Human Approved
- Human Curated
- Human–AI Co-Created
- AI Drafted • Human Edited
- AI Drafted
- AI Generated

## Design System
- Shields.io–style pill shape with rounded corners.
- Left chip reads `AI` on a purple → magenta gradient and includes a small sparkle icon to signal AI assistance.
- Right chip carries the category text on a neutral ink background for contrast.
- Typeface: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif fallback.
- Default size: 20px tall; scalable without loss (vector).

## Usage Guidelines (office & comms first)
- Use one badge per artifact: emails, reports, slide decks, one-pagers, FAQs, customer replies.
- Pick the badge that reflects the **highest** AI involvement; if unsure, default to **Human–AI Co-Created**.
- Place it where people look first: email signature/footer, slide title or footer, document cover, FAQ header.
- Keep it with the file so it travels (e.g., in a shared drive folder or the PDF footer).
- For customer-facing comms, include alt text (e.g., “AI Drafted • Human Edited”) for accessibility and when images are blocked.

## Assets
Generated assets live under `badges/`:
- badges/svg/ — individual SVGs.
- badges/png/1x/ — PNG exports at 20px tall (sharp at native size).
- badges/png/2x/ — PNG exports at 40px tall (use directly for larger badges or downscale in CSS for HiDPI).
- sprites/sprite.svg — symbol sprite for inlining <use> references.

## Quick Start
```sh
python scripts/generate_badges.py
```
Outputs SVG + PNG + sprite to the directories above.

## Embedding Examples
- Markdown: ![Human–AI Co-Created](badges/png/human-ai-co-created.png)
- HTML (sprite):
  ```html
  <svg role="img" aria-label="AI Suggested • Human Approved" width="220" height="20">
    <use href="sprites/sprite.svg#ai-suggested-human-approved" />
  </svg>
  ```
- Shields.io fallback (text-only): https://img.shields.io/badge/AI-Suggested%E2%80%A2Human%20Approved-6B7280?logo=sparkles&logoColor=white&labelColor=7B5CF9

## License
MIT for code; badges may be used and embedded without attribution.
