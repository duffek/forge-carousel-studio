# FoundersForge · Carousel Studio

Turn a written story into a ready-to-post Instagram carousel (portrait 4:5, 1080×1350).

Paste a story, pick how many bold points to cover, and the app drafts a full carousel with Claude — a cover, punchy point slides, and a closer. Slides that need imagery get on-demand AI photos from Gemini ("Nano Banana Pro"). Review the lineup, open any slide in the editor (inline text editing, layout switching, type-size control, image prompt + generate/upload), then export slides as 1080×1350 PNGs.

The original design handoff (spec + working prototype) lives in [`design/`](design/README.md).

## Getting started

Requires Docker (for the local Supabase stack) and the `supabase` CLI.

```bash
npm install
supabase start                     # local Postgres + storage (Docker)
cp .env.local.example .env.local   # add your keys; supabase status shows the URL/key
npm run dev
```

`.env.local`:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Carousel text generation (Claude) |
| `GEMINI_API_KEY` | Image generation (Gemini Nano Banana Pro) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Story storage — from `supabase status` (local) or your hosted project |
| `MOCK_AI=1` | Run without AI keys — both AI routes serve deterministic mock data |
| `ANTHROPIC_MODEL` | Optional model override (default `claude-opus-4-8`) |
| `GEMINI_IMAGE_MODEL` | Optional model override (default `gemini-3-pro-image-preview`) |

Stories auto-save to Supabase (Postgres `projects` table + `slides` storage bucket for images). The default view lists every story in progress; open one to work on its slides.

Each story has a **brand theme** — FoundersForge, Avante, or Startup Mtn. Summit — controlling slide colors, fonts, and wordmark. Pick it at Compose or switch any time in the editor's Branding panel.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — lint
- `supabase start` / `supabase stop` — local database
