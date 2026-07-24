import type { Layout, Slide } from "./types";

export const LAYOUTS: Layout[] = ["cover", "statement", "split", "closer"];

export const LAYOUT_LABEL: Record<Layout, string> = {
  cover: "Cover",
  statement: "Statement",
  split: "Split · image",
  closer: "Closer",
};

export const HAS_IMAGE: Record<Layout, boolean> = {
  cover: true,
  statement: false,
  split: true,
  closer: true,
};

export function uid(): string {
  return "sl_" + Math.random().toString(36).slice(2, 9);
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function blankSlide(layout: Layout = "statement"): Slide {
  const s: Slide = {
    id: uid(),
    layout,
    kicker: "",
    headline: "",
    body: "",
    bullets: [],
    hScale: 1,
    bScale: 1,
    wordmark: layout === "cover" || layout === "closer",
  };
  if (HAS_IMAGE[layout]) {
    s.image = { prompt: "", dataUrl: null, opacity: layout === "closer" ? 0.3 : 1 };
  }
  return s;
}

// Deterministic duotone palettes for the editorial placeholder
export const PH_PALETTES: [string, string][] = [
  ["#2a211a", "#0a0806"],
  ["#1c2026", "#05070a"],
  ["#20150c", "#07040a"],
  ["#1a1a1f", "#060607"],
  ["#241016", "#080306"],
  ["#12211c", "#050a08"],
];

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
