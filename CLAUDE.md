# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

FoundersForge **Carousel Studio** — a Next.js app that turns written stories into ready-to-post Instagram carousels (portrait 4:5, 1080×1350). The default **Stories** view lists all carousels in progress (stored in Supabase); opening one leads to **Lineup** → **Editor**. New stories start at **Compose**, where an LLM drafts a cover + N point slides + a closer; per-slide images are generated with Gemini ("Nano Banana Pro") and exported as PNGs.

`design/` is the original design-handoff bundle (working HTML/Babel prototype + `design/README.md` spec). It is the authoritative reference for visuals, copy, and interaction details — it is **not** shipped code and is excluded from lint.

## Commands

- `supabase start` / `supabase stop` — local Supabase stack (Docker); **required for the app to run**. `supabase status` prints the URL/keys.
- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check
- `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"` — inspect the local DB (`projects` table, `storage.objects`)

There is no test suite; verify changes by running the app (AI routes work key-free in mock mode, below).

## Environment

`.env.local` (see `.env.local.example`):

- `ANTHROPIC_API_KEY` — carousel text generation (Claude, model overridable via `ANTHROPIC_MODEL`, default `claude-opus-4-8`)
- `GEMINI_API_KEY` — image generation (model overridable via `GEMINI_IMAGE_MODEL`, default `gemini-3-pro-image-preview`)
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from `supabase status` (local) or the hosted project's settings. Server-side only; the browser never talks to Supabase directly.
- `MOCK_AI=1` — the two AI routes serve deterministic mock data (canned carousel, generated SVG images) with the same response contracts. Supabase is still required.

## Architecture

Single-page client app (`app/page.tsx`, all four views) over one Zustand store, plus server-only API routes that keep the AI and Supabase keys off the client.

- **Storage**: Supabase (local via Docker for dev; `supabase/` holds config + migrations). Postgres table `projects` (`id, title, meta jsonb, slides jsonb, timestamps`) + public storage bucket `slides` for images (`{projectId}/{slideId}-{ts}.ext`). All access goes through `app/api/projects*` / `upload-image` routes using the service-role client in `lib/supabase.ts` — never import that from client code. Slide `image.dataUrl` holds a storage **URL** once persisted (a transient `data:` URL only mid-upload), which keeps rows small and avoids the localStorage-era quota problem.
- **State**: `lib/store.ts` — plain Zustand (no persist middleware). `view` is `stories | compose | lineup | editor` (default `stories`). A module-level `subscribe` watcher debounces (600ms) a `PUT /api/projects/[id]` autosave whenever `slides`/`meta` change on an open project; `flushSave()` forces it on navigation. A legacy one-time localStorage migration (`ff-carousel-studio-v1`) lives in `app/page.tsx` — it claims the key *before* any network call because StrictMode double-runs effects (duplicate-project bug otherwise).
- **Data model**: `lib/types.ts` — `Slide { id, layout: cover|statement|split|closer, kicker, headline, body, bullets[], hScale, bScale, wordmark, image?: {prompt, dataUrl, opacity} }`, plus `Project`/`ProjectSummary`. Layout constants/helpers in `lib/slides.ts` (`HAS_IMAGE` decides which layouts carry an image; closer images default to 0.3 opacity).
- **Slide rendering**: `components/SlideView.tsx` is the single render engine used by every surface — lineup thumbnails, editor stage, rail thumbnails, and the 1080×1350 export. Sizing is CSS **container queries** (`container-type: inline-size`; every font/spacing value in `cqw`, scaled by `--hscale`/`--bscale`), so the same component is correct at every size. Never hardcode per-view pixel type sizes. Body text supports `*phrase*` → orange italic (raw asterisks shown while editing, rendered otherwise); headlines break lines on `\n` (`white-space: pre-line`).
- **API routes**: `app/api/generate-carousel` (Anthropic SDK, structured outputs via `output_config.format` json_schema — guaranteed-parseable JSON, normalized server-side into `Slide[]`); `app/api/generate-image` (`@google/genai`, uploads the result to the `slides` bucket and returns `{url}` — requires `projectId`/`slideId` in the body); `app/api/upload-image` (stores user-uploaded/migrated `data:` URLs); `app/api/projects` + `app/api/projects/[id]` (CRUD; DELETE also purges the project's storage folder). The AI routes have the `MOCK_AI` branch.
- **Export**: `lib/export.ts` renders `SlideView` into an off-screen 1080×1350 host and rasterizes with `modern-screenshot`. Fonts are self-hosted woff2 in `app/fonts/` via `next/font/local` (no runtime Google Fonts dependency — required for reliable export and offline dev).
- **Styling**: `app/globals.css` carries the entire ported design system (app chrome + slide render system) from the prototype, with font families mapped to the `next/font` variables (`--font-display/--font-body/--font-mono-f`). Tailwind is installed but the design system is deliberately plain CSS — keep it that way for fidelity with `design/README.md`.
