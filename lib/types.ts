export type Layout = "cover" | "statement" | "split" | "closer";

export type ThemeId = "foundersforge" | "avante" | "summit";

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
  /** Slide theme; absent on pre-theme stories → FoundersForge. */
  theme?: ThemeId;
}

export type View = "stories" | "compose" | "lineup" | "editor";

export interface ProjectSummary {
  id: string;
  title: string;
  slideCount: number;
  tone: string;
  theme?: ThemeId;
  updatedAt: string;
  coverSlide: Slide | null;
}

export interface Project {
  id: string;
  title: string;
  meta: Meta;
  slides: Slide[];
  updatedAt: string;
}

export interface GenerateConfig {
  story: string;
  points: number;
  tone: Tone;
  brand: string;
  cta: string;
  theme?: ThemeId;
}
