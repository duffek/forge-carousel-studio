"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GenerateConfig, Layout, Meta, Slide, SlideImage, View } from "./types";
import { blankSlide, uid } from "./slides";

const LS_KEY = "ff-carousel-studio-v1";

const defaultMeta: Meta = {
  title: "",
  brand: "FoundersForge",
  tone: "Provocative",
  story: "",
  points: 5,
  cta: "",
};

interface StudioState {
  view: View;
  slides: Slide[];
  meta: Meta;
  current: number;
  busy: boolean;
  busyStep: string;
  error: string;
  genIds: Record<string, boolean>;
  genAllBusy: boolean;
  genAllProgress: string;
  exportBusy: boolean;
  hasHydrated: boolean;

  setView: (view: View) => void;
  setCurrent: (i: number) => void;
  openEditor: (i: number) => void;
  setBusy: (busy: boolean) => void;
  setBusyStep: (step: string) => void;
  setError: (error: string) => void;
  setGenId: (id: string, on: boolean) => void;
  setGenAll: (busy: boolean, progress?: string) => void;
  setExportBusy: (busy: boolean) => void;
  finishHydration: () => void;

  setCarousel: (title: string, slides: Slide[], cfg: GenerateConfig) => void;
  patchMeta: (patch: Partial<Meta>) => void;
  patchSlide: (id: string, patch: Partial<Slide>) => void;
  patchImage: (id: string, patch: Partial<SlideImage>) => void;
  addSlide: (layout: Layout, at?: number | null) => void;
  dupSlide: (i: number) => void;
  delSlide: (i: number) => void;
  moveSlide: (from: number, to: number) => void;
}

export const useStudio = create<StudioState>()(
  persist(
    (set) => ({
      view: "compose",
      slides: [],
      meta: defaultMeta,
      current: 0,
      busy: false,
      busyStep: "",
      error: "",
      genIds: {},
      genAllBusy: false,
      genAllProgress: "",
      exportBusy: false,
      hasHydrated: false,

      setView: (view) => set({ view }),
      setCurrent: (current) => set({ current }),
      openEditor: (i) => set({ current: i, view: "editor" }),
      setBusy: (busy) => set({ busy }),
      setBusyStep: (busyStep) => set({ busyStep }),
      setError: (error) => set({ error }),
      setGenId: (id, on) =>
        set((s) => {
          const genIds = { ...s.genIds };
          if (on) genIds[id] = true;
          else delete genIds[id];
          return { genIds };
        }),
      setGenAll: (genAllBusy, genAllProgress = "") => set({ genAllBusy, genAllProgress }),
      setExportBusy: (exportBusy) => set({ exportBusy }),
      finishHydration: () =>
        set((s) =>
          s.hasHydrated
            ? s
            : { hasHydrated: true, view: s.slides.length ? "lineup" : "compose" },
        ),

      setCarousel: (title, slides, cfg) =>
        set({
          slides,
          meta: {
            title,
            brand: cfg.brand,
            tone: cfg.tone,
            story: cfg.story,
            points: cfg.points,
            cta: cfg.cta,
          },
          current: 0,
          view: "lineup",
        }),
      patchMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch } })),
      patchSlide: (id, patch) =>
        set((s) => ({
          slides: s.slides.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)),
        })),
      patchImage: (id, patch) =>
        set((s) => ({
          slides: s.slides.map((sl) =>
            sl.id === id
              ? {
                  ...sl,
                  image: {
                    ...(sl.image ?? { prompt: "", dataUrl: null, opacity: 1 }),
                    ...patch,
                  },
                }
              : sl,
          ),
        })),
      addSlide: (layout, at = null) =>
        set((s) => {
          const slides = [...s.slides];
          const idx = at == null ? slides.length : at;
          slides.splice(idx, 0, blankSlide(layout));
          return { slides };
        }),
      dupSlide: (i) =>
        set((s) => {
          const slides = [...s.slides];
          const clone: Slide = { ...structuredClone(s.slides[i]), id: uid() };
          slides.splice(i + 1, 0, clone);
          return { slides };
        }),
      delSlide: (i) =>
        set((s) => {
          if (s.slides.length <= 1) return s;
          const slides = s.slides.filter((_, x) => x !== i);
          return { slides, current: Math.min(s.current, slides.length - 1) };
        }),
      moveSlide: (from, to) =>
        set((s) => {
          const slides = [...s.slides];
          const [m] = slides.splice(from, 1);
          slides.splice(to, 0, m);
          // keep `current` pointing at the same slide after the move
          let current = s.current;
          if (current === from) current = to;
          else if (from < current && to >= current) current -= 1;
          else if (from > current && to <= current) current += 1;
          return { slides, current };
        }),
    }),
    {
      name: LS_KEY,
      partialize: (s) => ({ slides: s.slides, meta: s.meta }),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
      },
    },
  ),
);
