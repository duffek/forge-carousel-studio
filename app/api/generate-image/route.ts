import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { uploadDataUrl } from "@/lib/supabase";

export const maxDuration = 300;

// "Nano Banana Pro" — Gemini's pro image model. Override via env if the id changes.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";

// MOCK_AI=1: deterministic duotone SVG so the full flow runs without a key.
const MOCK_PALETTES: [string, string, string][] = [
  ["#3d2c1e", "#0a0806", "#ff6b2b"],
  ["#22303c", "#05070a", "#f5a623"],
  ["#301f12", "#07040a", "#f08030"],
  ["#26262e", "#060607", "#ff6b2b"],
  ["#361822", "#080306", "#f5a623"],
  ["#16332a", "#050a08", "#f08030"],
];

function mockImage(prompt: string): string {
  let h = 0;
  for (let i = 0; i < prompt.length; i++) h = ((h << 5) - h + prompt.charCodeAt(i)) | 0;
  h = Math.abs(h);
  const [a, b, glow] = MOCK_PALETTES[h % MOCK_PALETTES.length];
  const cx = 200 + (h % 680);
  const cy = 250 + (h % 850);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="r" cx="${cx / 1080}" cy="${cy / 1350}" r="0.6"><stop offset="0" stop-color="${glow}" stop-opacity="0.35"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1350" fill="url(#g)"/><rect width="1080" height="1350" fill="url(#r)"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

interface Body {
  prompt?: string;
  projectId?: string;
  slideId?: string;
  /** Optional brand-mood suffix appended to the prompt (from the story's theme). */
  styleHint?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const prompt = body.prompt?.trim() ?? "";
  const { projectId, slideId } = body;
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (!projectId || !slideId) {
    return NextResponse.json(
      { error: "projectId and slideId are required" },
      { status: 400 },
    );
  }

  try {
    let dataUrl: string;

    if (process.env.MOCK_AI === "1") {
      await new Promise((r) => setTimeout(r, 400));
      dataUrl = mockImage(prompt);
    } else {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart." },
          { status: 500 },
        );
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const styleHint = body.styleHint?.trim() ? ` ${body.styleHint.trim()}` : "";
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: `Moody, cinematic editorial photograph, portrait 4:5 orientation. No text, words, or lettering anywhere in the image.${styleHint} ${prompt}`,
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "4:5" },
        },
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p) => p.inlineData?.data);
      if (!imagePart?.inlineData?.data) {
        throw new Error("Model returned no image");
      }
      const mime = imagePart.inlineData.mimeType || "image/png";
      dataUrl = `data:${mime};base64,${imagePart.inlineData.data}`;
    }

    // Persist to storage; the client stores the (small) public URL, not base64.
    const url = await uploadDataUrl(projectId, slideId, dataUrl);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
