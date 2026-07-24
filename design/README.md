# Handoff: FoundersForge Carousel Studio

## Overview
Carousel Studio is a web SaaS tool that turns a written story into a ready-to-post Instagram carousel (portrait 4:5, 1080×1350). A user pastes a story, chooses how many "bold points" to cover, and the app uses an LLM to draft a full carousel: a cover slide, N point slides, and a closer. Any slide that needs imagery gets an on-demand AI-generated photo (Gemini "Nano Banana Pro" image model). Users review the full lineup, open any slide in an editor (inline text editing, layout switch, per-slide type-size control, image prompt + generate), then export slides as PNGs.

The product has three primary views: **Compose → Lineup → Editor**, plus a persistent top bar.

## About the Design Files
The files in this bundle are **design references created in HTML/React-via-Babel** — a working prototype showing the intended look, layout, copy, and interaction model. They are **not production code to ship directly.** The task is to **recreate this design in your target codebase** using its established framework, patterns, and libraries. If no codebase exists yet, the recommended stack is **React + TypeScript + Vite** with a small state store (Zustand or Redux Toolkit) and a Node/edge backend for the two AI calls (text generation + image generation) so API keys stay server-side.

The prototype runs entirely in-browser: text generation goes through a host-provided `window.claude.complete` helper, and image generation is **stubbed** with a canvas-synthesized editorial image (see "Interactions → Image generation"). Both are marked integration points to replace with real backend calls.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, layout, and interactions are all specified here and present in the prototype. Recreate the UI pixel-perfectly using your codebase's libraries. The one deliberate placeholder is the image-generation call (stubbed) and the text-generation call (via host helper) — wire these to your real backend.

---

## Screens / Views

### Top bar (persistent, all views)
- **Height:** 58px, `flex: 0 0 58px`. Full width. `border-bottom: 1px solid rgba(255,255,255,.08)`. Background `linear-gradient(180deg,#141418,#0d0d10)`.
- **Left:** FoundersForge logo image, `height: 26px`, width auto (asset `ff-logo.png`, white horizontal lockup). Then a vertical divider and the label "CAROUSEL STUDIO" — Open Sans 600, 11px, `letter-spacing:.22em`, uppercase, color `#8b8b93`, `padding-left:13px; border-left:1px solid rgba(255,255,255,.08)`.
- **Center:** breadcrumb, 13px `#8b8b93`; the active title is bold white. Compose → "New carousel"; Lineup → "<Title> · Lineup"; Editor → "<Title> · Editing slide N" (clicking returns to Lineup).
- **Right:** contextual. Lineup shows meta "N slides · 1080×1350" (JetBrains Mono, 11px, `#63636b`). Editor shows a "Done editing" ghost button.

### 1. Compose
- **Purpose:** the entry point — user provides the raw story and generation settings, then generates the carousel.
- **Layout:** single centered column, `max-width:860px; margin:0 auto; padding:56px 24px 80px`.
  - Eyebrow "CAROUSEL STUDIO" — JetBrains Mono, 12px, `letter-spacing:.24em`, uppercase, color `#F08030`, margin-bottom 14px.
  - H1 — Barlow Condensed 900, 52px, `line-height:.98`, uppercase. Two lines; the second line ("scroll-stopping carousel.") uses the orange gradient text fill.
  - Lede paragraph — 16px, `line-height:1.55`, color `#8b8b93`, `max-width:620px`, margin-top 16px.
  - **Card panel** (`margin-top:34px`): background `#111114`, `border:1px solid rgba(255,255,255,.08)`, `border-radius:16px`, `padding:26px`. Contains, top to bottom:
    1. **Your story** — full-width `<textarea>` (7 rows). Hint line below with a "Load the Welch vs. Sinegal example →" link that fills all fields with the demo.
    2. **Bold points to cover** — a stepper: big gradient number (Barlow Condensed 900, 40px, min-width 52px) + range slider `min=3 max=10`. Label shows "{total} slides total · cover + {points} points + closer".
    3. **Row (2-col, collapses to 1 at ≤640px):** Tone segmented control (Provocative / Analytical / Inspirational / Story-driven) + Brand/wordmark text input.
    4. **Closing call-to-action** — optional text input.
    5. Error banner (conditional).
    6. Actions: primary "Generate carousel" button (disabled until story non-empty; shows spinner + "Generating…" while busy) and a status line showing the current generation step.

### 2. Lineup (gallery)
- **Purpose:** see all slides at a glance, generate images, reorder/add/delete, open any slide to edit, export.
- **Layout:** `padding:26px 30px 90px`.
  - **Header row** (space-between, wraps): left = editable title (`contentEditable`, Barlow Condensed 900, 30px, uppercase) + sub-line "N slides · {tone} tone · {X images to generate | all images ready}". Right = "New story" ghost button + "Export all PNGs" button.
  - **Toolbar** (`margin:18px 0 26px`, `padding:14px 16px`, bg `#111114`, `border-radius:12px`): primary "Generate all images (X)" button (shows "Generating i/N" while running; disabled when none missing), a "Nano Banana Pro" mono label, spacer, then "+ Statement" and "+ Split" ghost buttons.
  - **Grid:** `grid-template-columns: repeat(auto-fill, minmax(230px,1fr)); gap:22px`.
    - **Card:** bg `#111114`, `border:1px solid rgba(255,255,255,.08)`, `border-radius:14px`, overflow hidden. Hover: border lightens, `translateY(-2px)`, shadow `0 12px 30px rgba(0,0,0,.35)`. Draggable to reorder (drag-over state: orange border + ring; dragging: opacity .4).
      - **Thumb:** `aspect-ratio:4/5`, black bg, cursor pointer → opens editor. Top-left badge "NN · <Layout>" (JetBrains Mono 10.5px, uppercase, translucent black pill). Hover overlay: dark scrim + centered "Open editor" button. Renders the live slide at thumbnail scale.
      - **Foot:** `padding:10px 12px`, top border. Layout label (11.5px, capitalize) + two 28px icon buttons: Duplicate (⧉) and Delete (✕).
    - **Add card:** dashed border, centered "+" (30px) over "Add slide". Hover → orange.

### 3. Editor (single slide)
- **Purpose:** focused editing of one slide with live preview and full controls.
- **Layout:** vertical flex filling the viewport below the top bar.
  - **Ed-top bar** (`padding:12px 18px`, bg `#111114`, bottom border): "‹ All slides" ghost button, "NN / NN" index (JetBrains Mono 13px), divider, layout label, spacer, "Duplicate" + "Delete (danger)" ghost buttons, "Save PNG" button.
  - **Ed-body** (flex row, fills height):
    - **Ed-main** (flex:1, centered column, `padding:24px`, overflow auto): background is a **light mid-gray** — `#3a3a42` with `radial-gradient(140% 100% at 50% -10%, #4a4a54, #2f2f37 70%)` — so the black slide edges are clearly distinguishable from the canvas. Contains:
      - Prev/Next circular nav buttons (44px, absolute, vertically centered, left/right 18px; disabled at ends).
      - **Stage slide:** `height:min(66vh,600px); aspect-ratio:4/5`, shadow `0 30px 70px rgba(0,0,0,.55)`. Renders the slide with **inline editable** text fields.
      - **Image bar** (directly below the slide, `max-width:520px`, width matched to slide): a textarea for the image prompt (flex:1, left), an "Upload" ghost button, and a primary "✦ Generate image" button (right). For text-only (statement) slides this row instead shows an italic note that the layout has no image.
    - **Inspector** (right column, `width:330px`, left border, bg `#111114`, scrolls). Sections:
      - **Layout:** 2×2 chip grid (Cover / Statement / Split · image / Closer); active chip = orange border + tint.
      - **Content:** Kicker (input), Headline (textarea, "Enter for new line"), Body (textarea, "wrap *word* for orange"), and — split layout only — Bullets (textarea, one per line).
      - **Type size:** Headline slider + Body slider (each `min .55 max 1.6 step .05`, shown as %) + "Reset sizes" button. These scale the slide's type live.
      - **Image** (image layouts only): Prompt textarea, Opacity slider (`.1–1`), "Clear image" button.
      - **Branding** (cover/closer only): "Show wordmark" toggle switch.
  - **Rail** (bottom, `padding:12px 16px`, top border, horizontal scroll): 66px-wide 4:5 thumbnails of every slide (active = orange border, index badge bottom-right), plus a dashed "+" add-slide button.

---

## Slide render system (the core visual engine)
All three views render the same `SlideView` component at different container sizes. The slide is a **4:5 box** using **CSS container queries** (`container-type: inline-size`) so every font size and spacing value is expressed in `cqw` (percent of container width) and scales identically at any size — thumbnail, editor stage, or 1080px export. Recreate this behavior (container-relative sizing) rather than hardcoding px per view.

### Slide layouts (the `layout` field)
- **cover** — full-bleed image with a top-and-bottom dark gradient scrim; bottom-anchored content: kicker, XXL gradient headline, small body; logo wordmark; "swipe" hint bottom-right; counter top-right.
- **statement** — text-only, vertically centered: kicker (body style), XL gradient headline, body. Swipe + counter.
- **split** — top text block (kicker, MD gradient headline, small body, optional bullet list) over a bottom image occupying 44% height. Swipe + counter.
- **closer** — like cover (full-bleed image, dimmed) with XL gradient headline, divider, small body (the CTA), logo wordmark; counter.

### Slide type scale (cqw against the 4:5 container width)
- `.body` = `4.2cqw * --bscale`; `.body.small` = `3.6cqw * --bscale`; `.kicker` = `4cqw * --bscale`.
- `.accent` (gradient headline) base `9.2cqw * --hscale`; `.accent.md` `7.6cqw`; `.accent.xl` `11.4cqw`; `.accent.xxl` `14cqw` (all × `--hscale`).
- `--hscale` / `--bscale` default 1, driven by the editor Type-size sliders (range .55–1.6).
- `.counter` `2.1cqw`; `.swipe` `3.4cqw`; wordmark logo `height:5cqw`.
- Line-heights: body 1.28; accent .9–.98 (tighter as it grows).

### Emphasis markup
Body text supports lightweight inline emphasis: a phrase wrapped in `*asterisks*` renders as **orange italic** (`#F08030`, `font-style:italic`). In edit mode the raw `*…*` is shown; in display/thumbnail/export it renders formatted. Headlines use `\n` for explicit line breaks (`white-space: pre-line`).

### Image / placeholder
- If a slide's `image.dataUrl` is set, render `<img>` cover-filling the photo area at `image.opacity` (default 1; closer default 0.3).
- Otherwise render an **editorial placeholder**: a striped/grained duotone panel (palette chosen deterministically by hashing the prompt) with a "Nano Banana Pro" corner tag and the prompt text centered, or a "No image yet" prompt.

---

## Interactions & Behavior

### Carousel generation (Compose → Lineup)
- On "Generate carousel": call the LLM with a system prompt (senior editorial designer, tone-aware, JSON-only) and a user prompt containing the story + settings + a strict JSON schema. Steps surfaced to the user: "Reading your story…" → "Drafting slides & image prompts…" → "Assembling carousel…".
- **Expected JSON:** `{ "title": string, "slides": Slide[] }` where `Slide = { layout, kicker?, headline, body?, bullets?, image?: { prompt } }`.
- **Rules enforced in the prompt:** exactly `points+2` slides; first `cover`, last `closer`, exactly `points` point slides between; alternate `statement`/`split` (roughly half `split`); headline is a short punchy hook (2-4 words/line, ≤3 lines, `\n` breaks); kicker ≤6 words; body 1-2 sentences with exactly one `*emphasis*`; bullets only where a 2-4 item list fits; every cover/split/closer includes a vivid ~15-30 word editorial photo prompt (no text in image); closer body contains the user's CTA verbatim.
- Parse defensively: strip markdown fences, slice from first `{` to last `}`, `JSON.parse`. Assign ids; init `image.dataUrl=null`; `hScale=bScale=1`. On success set slides + meta, go to Lineup. On failure show an error and stay on Compose.
- **Prototype model:** `claude-sonnet-4-5`, `max_tokens:4000` via `window.claude.complete`. **Replace** with your backend LLM call.

### Image generation (Nano Banana Pro)
- Per-slide "Generate image" (editor) and "Generate all images (X)" (lineup, sequential with i/N progress). Button shows spinner while busy.
- **Integration point** (`generateImage(prompt, seed)` in `cc-slides.jsx`): production should POST `{ model:'gemini-3-pro-image', prompt }` to a backend proxy that calls Gemini and returns a `dataUrl` (or hosted URL). Keep the API key server-side.
- **Prototype stub:** synthesizes an on-brand editorial image on a 1080×1350 canvas (deterministic duotone gradient + radial glows + diagonal streaks + film grain + vignette from a hash of the prompt) after an ~0.9-1.6s simulated latency, so the flow is fully working without a key. Remove in production.
- Users can also **upload** their own image (file input / drag; read as data URL) and adjust **opacity**, or **Clear image**.

### Editing
- **Inline:** slide text fields are `contentEditable` in the editor stage; blur writes back to state. The inspector textareas/inputs edit the same fields (two-way).
- **Layout switch:** changing layout preserves text; adds a default `image` object if the new layout needs one.
- **Type size:** Headline/Body sliders set `hScale`/`bScale` on the slide.
- **Slide ops:** add (at end or after current), duplicate (deep clone, new id, inserted after), delete (blocked when only 1 slide; clamps current index), reorder (drag in lineup grid).
- **Navigation:** click thumb/rail item or prev/next to change `current`; "All slides"/"Done editing" return to lineup.

### Export
- **Save PNG** (single) and **Export all PNGs**: render the slide off-screen at exactly **1080×1350** and rasterize with `modern-screenshot` `domToPng`. Google Fonts are fetched and inlined as base64 before capture so text renders correctly. Filenames: `<title-slug>-NN.png`. In production, prefer server-side rendering for reliable font/image rasterization.

### Persistence
- The whole project (`slides` + `meta`) is saved to `localStorage` under key `ff-carousel-studio-v1` on every change and restored on load (lands on Lineup if a saved carousel exists, else Compose). In production, persist to a real backend/DB keyed per user + document.

### Responsive
- The tool targets desktop widths. Compose's 2-col row collapses to 1 at ≤640px. The grid uses auto-fill. The editor's 330px inspector is fixed; the stage scales via `min(66vh,600px)`.

---

## State Management
- **view**: `'compose' | 'lineup' | 'editor'`.
- **slides**: `Slide[]` — `{ id, layout, kicker, headline, body, bullets[], hScale, bScale, wordmark, image?: { prompt, dataUrl, opacity } }`.
- **meta**: `{ title, brand, tone, story, points, cta }`.
- **current**: index of the slide open in the editor.
- **busy / busyStep / error**: generation status.
- **genIds**: map of slide id → true while its image is generating; **genAllBusy / genAllProgress**; **exportBusy**.
- Transitions: Compose.onGenerate → sets slides+meta, view=lineup. Card/thumb click → current+view=editor. Layout chip → patch layout (+default image). Sliders/inputs → patch slide fields. Data fetching: two async calls (LLM text, image gen) — both should be backend endpoints in production.

---

## Design Tokens

### Colors
| Token | Value | Use |
|---|---|---|
| grad-start | `#FF6B2B` | orange gradient start (headlines, primary buttons, accents) |
| grad-end | `#F5A623` | orange gradient end |
| italic-orange | `#F08030` | emphasis text, links, active accents |
| bg | `#0a0a0c` | app background |
| panel | `#111114` | cards, top bar panels, inspector |
| panel-2 | `#17171b` | button/inset surfaces |
| line | `rgba(255,255,255,.08)` | hairline borders |
| line-2 | `rgba(255,255,255,.14)` | stronger borders / input outlines |
| ink | `#ececf0` | primary text |
| muted | `#8b8b93` | secondary text |
| muted-2 | `#63636b` | tertiary / hints |
| editor canvas | `#3a3a42` + radial `#4a4a54→#2f2f37` | editor main background (light, to frame the black slide) |
| slide bg | `#000` | slide background |
| danger hover | border `#5b2b2b`, text `#ff8a8a`, bg `rgba(120,40,40,.15)` | delete states |

Orange gradient (headlines/wordmark dot): `linear-gradient(180deg,#FF6B2B,#F5A623)` for text fill; buttons use `linear-gradient(160deg,#FF6B2B,#F5A623)` with text `#120a04`.

### Typography
- **Display / headlines:** Barlow Condensed (weights 600/700/900), uppercase, `letter-spacing:.005em`.
- **Body / UI:** Open Sans (400/500/600/700, plus italic 500/600).
- **Mono / labels / meta:** JetBrains Mono (400/500/600), wide letter-spacing.
- App UI sizes: buttons 13px/600; small buttons 12px; labels 12px/600; inspector inputs 13.5px; mono meta 11px.

### Spacing / radius / misc
- Radii: buttons 8px (sm 7px, lg 10px), cards 14px, panels 12-16px, inputs 8-10px, pills/badges 6px.
- Button padding: default `9px 15px`, sm `6px 11px`, lg `14px 26px`.
- Focus ring on inputs: border `#F08030` + `box-shadow:0 0 0 3px rgba(240,128,48,.12)`.
- Card hover shadow: `0 12px 30px rgba(0,0,0,.35)`; stage shadow `0 30px 70px rgba(0,0,0,.55)`.
- Spinner: 16px, 2px border, orange top, 0.7s linear spin (dark variant for on-orange buttons).
- Toggle switch: 42×24px, orange gradient when on.
- Scrollbars: 10px, thumb `#26262c`.

### Export dimensions
- Slide artboard: **1080×1350 px** (Instagram portrait 4:5).

---

## Assets
- **`images/ff-logo.png`** — FoundersForge horizontal logo, white lockup on transparent (≈2064×274). Used in the top bar (26px tall) and as the on-slide wordmark on cover/closer (`height:5cqw`). Provided by the user. In production, use your brand system's canonical logo asset.
- **Fonts** — Google Fonts: Barlow Condensed, Open Sans, JetBrains Mono. Self-host in production.
- **Generated images** — created at runtime by Nano Banana Pro (stubbed in prototype). No static image assets ship with slides.
- **Third-party lib** — `modern-screenshot` (PNG export). Replaceable with server-side rendering.

---

## Files (in this bundle)
- **`Carousel Tool.html`** — app shell: fonts, all CSS (app chrome + slide render system), script tags, `#root`. Loads React 18 + Babel standalone + `modern-screenshot`, then the JSX files below.
- **`cc-slides.jsx`** — `SlideView` (the 4:5 render engine + all four layouts), `Editable`, emphasis renderer, `ImageArea`/placeholder, slide data model (`blankSlide`), and `generateImage` (Nano Banana Pro integration point + prototype synth).
- **`cc-compose.jsx`** — the Compose view + the built-in example content.
- **`cc-lineup.jsx`** — the Lineup gallery (grid, drag-reorder, toolbar).
- **`cc-editor.jsx`** — the single-slide Editor (stage, image bar, inspector, rail).
- **`cc-app.jsx`** — `App`: state, view routing, LLM carousel generation (`generateCarousel`), PNG export (`renderPng` + font inlining), localStorage persistence; mounts to `#root`.

> Note on the prototype architecture: it uses in-browser Babel and separate `<script type="text/babel">` files that share code via a `window.CC` namespace. This is a **prototyping convenience only** — in your codebase use real modules/imports and a build step; do not replicate the `window.CC` pattern.
