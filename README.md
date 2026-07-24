# FoundersForge · Carousel Studio

Turn a written story into a ready-to-post Instagram carousel (portrait 4:5, 1080×1350).

Paste a story, pick how many bold points to cover, and the app drafts a full carousel with Claude — a cover, punchy point slides, and a closer. Slides that need imagery get on-demand AI photos from Gemini ("Nano Banana Pro"). Review the lineup, open any slide in the editor (inline text editing, layout switching, type-size control, image prompt + generate/upload), then export slides as 1080×1350 PNGs.

The original design handoff (spec + working prototype) lives in [`design/`](design/README.md).

## Getting started

```bash
npm install
cp .env.local.example .env.local   # add your keys
npm run dev
```

`.env.local`:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Carousel text generation (Claude) |
| `GEMINI_API_KEY` | Image generation (Gemini Nano Banana Pro) |
| `MOCK_AI=1` | Run without keys — both AI routes serve deterministic mock data |
| `ANTHROPIC_MODEL` | Optional model override (default `claude-opus-4-8`) |
| `GEMINI_IMAGE_MODEL` | Optional model override (default `gemini-3-pro-image-preview`) |

Carousels auto-save to the browser's localStorage and restore on reload.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — lint
