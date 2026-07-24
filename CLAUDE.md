# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

FoundersForge **Carousel Studio** — a Next.js app that turns a written story into a ready-to-post Instagram carousel (portrait 4:5, 1080×1350). The user pastes a story on **Compose**, an LLM drafts a cover + N point slides + a closer, per-slide images are generated with Gemini ("Nano Banana Pro"), and the user reviews the **Lineup**, refines slides in the **Editor**, and exports PNGs.

`design/` is the original design-handoff bundle (working HTML/Babel prototype + `design/README.md` spec). It is the authoritative reference for visuals, copy, and interaction details — it is **not** shipped code and is excluded from lint.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check

There is no test suite; verify changes by running the app (works fully in mock mode, below).

## Environment

`.env.local` (see `.env.local.example`):

- `ANTHROPIC_API_KEY` — carousel text generation (Claude, model overridable via `ANTHROPIC_MODEL`, default `claude-opus-4-8`)
- `GEMINI_API_KEY` — image generation (model overridable via `GEMINI_IMAGE_MODEL`, default `gemini-3-pro-image-preview`)
- `MOCK_AI=1` — both API routes serve deterministic mock data (canned carousel, generated SVG images) with the same response contracts. Lets the entire app run and be e2e-tested without keys. Remove once real keys are set.

## Architecture

Single-page client app (`app/page.tsx`, all three views) over one Zustand store, plus two server-only API routes that keep the AI keys off the client.

- **State**: `lib/store.ts` — Zustand + `persist` to localStorage key `ff-carousel-studio-v1` (persists `slides` + `meta` only). `view` is `compose | lineup | editor`; on rehydrate the app lands on Lineup if slides exist. The page gates rendering on `hasHydrated` to avoid SSR hydration mismatch — note the rehydrate callback runs synchronously *during* store creation, so it must not reference the exported store constant (use the `finishHydration` action).
- **Data model**: `lib/types.ts` — `Slide { id, layout: cover|statement|split|closer, kicker, headline, body, bullets[], hScale, bScale, wordmark, image?: {prompt, dataUrl, opacity} }`. Layout constants/helpers in `lib/slides.ts` (`HAS_IMAGE` decides which layouts carry an image; closer images default to 0.3 opacity).
- **Slide rendering**: `components/SlideView.tsx` is the single render engine used by every surface — lineup thumbnails, editor stage, rail thumbnails, and the 1080×1350 export. Sizing is CSS **container queries** (`container-type: inline-size`; every font/spacing value in `cqw`, scaled by `--hscale`/`--bscale`), so the same component is correct at every size. Never hardcode per-view pixel type sizes. Body text supports `*phrase*` → orange italic (raw asterisks shown while editing, rendered otherwise); headlines break lines on `\n` (`white-space: pre-line`).
- **API routes**: `app/api/generate-carousel/route.ts` (Anthropic SDK, structured outputs via `output_config.format` json_schema — response is guaranteed-parseable JSON, then normalized server-side into `Slide[]`) and `app/api/generate-image/route.ts` (`@google/genai`, returns a base64 `dataUrl`). Both have the `MOCK_AI` branch.
- **Export**: `lib/export.ts` renders `SlideView` into an off-screen 1080×1350 host and rasterizes with `modern-screenshot`. Fonts are self-hosted woff2 in `app/fonts/` via `next/font/local` (no runtime Google Fonts dependency — required for reliable export and offline dev).
- **Styling**: `app/globals.css` carries the entire ported design system (app chrome + slide render system) from the prototype, with font families mapped to the `next/font` variables (`--font-display/--font-body/--font-mono-f`). Tailwind is installed but the design system is deliberately plain CSS — keep it that way for fidelity with `design/README.md`.
