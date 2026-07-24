export type Layout = "cover" | "statement" | "split" | "closer";

export type Tone = "Provocative" | "Analytical" | "Inspirational" | "Story-driven";

export interface SlideImage {
  prompt: string;
  dataUrl: string | null;
  opacity: number;
}

export interface Slide {
  id: string;
  layout: Layout;
  kicker: string;
  headline: string;
  body: string;
  bullets: string[];
  hScale: number;
  bScale: number;
  wordmark: boolean;
  image?: SlideImage;
}

export interface Meta {
  title: string;
  brand: string;
  tone: Tone;
  story: string;
  points: number;
  cta: string;
}

export type View = "compose" | "lineup" | "editor";

export interface GenerateConfig {
  story: string;
  points: number;
  tone: Tone;
  brand: string;
  cta: string;
}
