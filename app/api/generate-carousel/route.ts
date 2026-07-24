import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { GenerateConfig, Layout, Slide } from "@/lib/types";
import { HAS_IMAGE, uid } from "@/lib/slides";

export const maxDuration = 300;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

interface RawSlide {
  layout: string;
  kicker?: string;
  headline: string;
  body?: string;
  bullets?: string[];
  image?: { prompt: string };
}

// Strict JSON schema for structured outputs — guarantees parseable output.
const CAROUSEL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "slides"],
  properties: {
    title: {
      type: "string",
      description: "A short punchy title for the whole carousel",
    },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["layout", "headline"],
        properties: {
          layout: { type: "string", enum: ["cover", "statement", "split", "closer"] },
          kicker: { type: "string" },
          headline: { type: "string" },
          body: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
          image: {
            type: "object",
            additionalProperties: false,
            required: ["prompt"],
            properties: { prompt: { type: "string" } },
          },
        },
      },
    },
  },
} as const;

function normalizeSlides(raw: RawSlide[]): Slide[] {
  const layouts: Layout[] = ["cover", "statement", "split", "closer"];
  return (raw || []).map((sd) => {
    const layout = layouts.includes(sd.layout as Layout)
      ? (sd.layout as Layout)
      : "statement";
    const s: Slide = {
      id: uid(),
      layout,
      kicker: sd.kicker || "",
      headline: sd.headline || "",
      body: sd.body || "",
      bullets: Array.isArray(sd.bullets) ? sd.bullets : [],
      hScale: 1,
      bScale: 1,
      wordmark: layout === "cover" || layout === "closer",
    };
    if (HAS_IMAGE[layout]) {
      s.image = {
        prompt: sd.image?.prompt || "",
        dataUrl: null,
        opacity: layout === "closer" ? 0.3 : 1,
      };
    }
    return s;
  });
}

function buildPrompts({ story, points, tone, brand, cta }: GenerateConfig) {
  const system = `You are a senior editorial content designer creating punchy Instagram carousels for a founder-focused brand. You write in a sharp, ${tone.toLowerCase()} voice. You output ONLY valid JSON matching the provided schema — no markdown, no commentary.`;

  const rules = `Return JSON: {"title": string, "slides": Slide[]}.
Slide = {"layout": "cover"|"statement"|"split"|"closer", "kicker"?: string, "headline": string, "body"?: string, "bullets"?: string[], "image"?: {"prompt": string}}.
Rules:
- Exactly ${points + 2} slides: first is layout "cover", last is layout "closer", and exactly ${points} point slides between them.
- For the ${points} point slides, alternate between "statement" (text-only, big idea) and "split" (text + image). Aim for a good rhythm; make roughly half "split".
- headline: the punchy hook, UPPERCASE-friendly short phrase, 2-4 words per line, use "\\n" to break lines (max 3 lines). This is the dominant text.
- kicker: a short setup line above the headline (optional, <=6 words).
- body: 1-2 tight sentences that land the point. In body only, wrap ONE key phrase in *asterisks* for emphasis.
- bullets: only on some "split" slides where a list fits (2-4 short items); otherwise omit.
- Every "cover", "split" and "closer" slide MUST include image.prompt: a vivid, moody, cinematic EDITORIAL PHOTO direction for an AI image model (Gemini Nano Banana Pro). Describe subject, lighting, mood, composition. No text/words in the image. ~15-30 words.
- cover: hook the scroll. closer: pay off the story and include this call to action verbatim in the body: "${cta || "Follow for more."}".
- Keep it provocative and specific to the story. No fluff.`;

  const user = `STORY:\n${story}\n\nBRAND: ${brand}\nPOINTS: ${points}\nTONE: ${tone}\n\n${rules}`;
  return { system, user };
}

// MOCK_AI=1 serves a deterministic carousel so the full flow can run without keys
// (local dev / e2e tests). Same response contract as the real path.
function mockCarousel(cfg: GenerateConfig): { title: string; slides: RawSlide[] } {
  const pts: RawSlide[] = [];
  for (let i = 0; i < cfg.points; i++) {
    if (i % 2 === 0) {
      pts.push({
        layout: "statement",
        kicker: `Bold point ${i + 1}`,
        headline: `THE BIG\nIDEA ${i + 1}`,
        body: `A tight sentence that lands point ${i + 1} with *real emphasis*.`,
      });
    } else {
      pts.push({
        layout: "split",
        kicker: `Bold point ${i + 1}`,
        headline: `PROOF\nPOINT ${i + 1}`,
        body: `Supporting detail for point ${i + 1}, made *concrete*.`,
        bullets: i === 1 ? ["First receipt", "Second receipt", "Third receipt"] : undefined,
        image: {
          prompt: `Moody cinematic editorial photo illustrating point ${i + 1}, dramatic side lighting, shallow depth of field`,
        },
      });
    }
  }
  return {
    title: "Mock carousel",
    slides: [
      {
        layout: "cover",
        kicker: "A story worth stopping for",
        headline: "STOP THE\nSCROLL",
        body: "The hook that pulls readers in, with *one emphasis*.",
        image: {
          prompt:
            "Cinematic low-key portrait of a lone founder at a desk, dramatic rim light, moody shadows",
        },
      },
      ...pts,
      {
        layout: "closer",
        headline: "THE REAL\nLESSON",
        body: cfg.cta || "Follow for more.",
        image: {
          prompt:
            "Wide moody editorial shot of an empty boardroom at dusk, warm window light, cinematic haze",
        },
      },
    ],
  };
}

export async function POST(req: Request) {
  if (process.env.MOCK_AI === "1") {
    let cfg: GenerateConfig;
    try {
      cfg = (await req.json()) as GenerateConfig;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!cfg?.story?.trim()) {
      return NextResponse.json({ error: "Story is required" }, { status: 400 });
    }
    const mock = mockCarousel(cfg);
    return NextResponse.json({
      title: mock.title,
      slides: normalizeSlides(mock.slides),
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart." },
      { status: 500 },
    );
  }

  let cfg: GenerateConfig;
  try {
    cfg = (await req.json()) as GenerateConfig;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!cfg?.story?.trim()) {
    return NextResponse.json({ error: "Story is required" }, { status: 400 });
  }

  const { system, user } = buildPrompts(cfg);
  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: user }],
      output_config: {
        format: { type: "json_schema", schema: CAROUSEL_SCHEMA },
      },
    });

    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("Model returned no output");
    const data = JSON.parse(text) as { title?: string; slides?: RawSlide[] };

    const slides = normalizeSlides(data.slides || []);
    if (!slides.length) throw new Error("No slides returned");

    return NextResponse.json({ title: data.title || "Untitled carousel", slides });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
