import type { ThemeId } from "./types";

export interface Theme {
  id: ThemeId;
  name: string;
  wordmark: string;
  /** Three representative colors for picker swatches. */
  swatch: [string, string, string];
  /** Appended to the image-generation prompt to steer brand mood. */
  imageStyleHint: string;
}

// Visual specs live in app/globals.css as .slide[data-theme=...] variable
// overrides — sourced from the Canva brand kits (Avante FF deck, SMS cards).
export const THEMES: Record<ThemeId, Theme> = {
  foundersforge: {
    id: "foundersforge",
    name: "FoundersForge",
    wordmark: "/images/ff-logo.png",
    swatch: ["#0a0a0c", "#ff6b2b", "#f5a623"],
    imageStyleHint: "",
  },
  avante: {
    id: "avante",
    name: "Avante",
    wordmark: "/images/avante-logo.png",
    swatch: ["#03265b", "#7ed957", "#ffffff"],
    imageStyleHint:
      " Clean, optimistic mood, cool natural daylight, subtle blue and green tones.",
  },
  summit: {
    id: "summit",
    name: "Startup Mtn. Summit",
    wordmark: "/images/sms-logo.png",
    swatch: ["#0c2b33", "#f5b518", "#e41a23"],
    imageStyleHint:
      " Warm stage lighting, live event energy, amber highlights, conference atmosphere.",
  },
};

export const THEME_IDS: ThemeId[] = ["foundersforge", "avante", "summit"];
export const DEFAULT_THEME: ThemeId = "foundersforge";

export function themeOf(id: ThemeId | undefined): Theme {
  return THEMES[id ?? DEFAULT_THEME] ?? THEMES[DEFAULT_THEME];
}
