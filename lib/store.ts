"use client";

import { create } from "zustand";
import type {
  GenerateConfig,
  Layout,
  Meta,
  Project,
  ProjectSummary,
  Slide,
  SlideImage,
  View,
} from "./types";
import { blankSlide, uid } from "./slides";

// Legacy single-carousel localStorage key — migrated to Supabase on boot.
export const LEGACY_LS_KEY = "ff-carousel-studio-v1";

const defaultMeta: Meta = {
  title: "",
  brand: "FoundersForge",
  tone: "Provocative",
  story: "",
  points: 5,
  cta: "",
};

export type SaveState = "saved" | "saving" | "error";

interface StudioState {
  view: View;
  loading: boolean;
  projects: ProjectSummary[];
  currentId: string | null;
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
  saveState: SaveState;

  setView: (view: View) => void;
  setCurrent: (i: number) => void;
  openEditor: (i: number) => void;
  setBusy: (busy: boolean) => void;
  setBusyStep: (step: string) => void;
  setError: (error: string) => void;
  setGenId: (id: string, on: boolean) => void;
  setGenAll: (busy: boolean, progress?: string) => void;
  setExportBusy: (busy: boolean) => void;

  patchMeta: (patch: Partial<Meta>) => void;
  patchSlide: (id: string, patch: Partial<Slide>) => void;
  patchImage: (id: string, patch: Partial<SlideImage>) => void;
  addSlide: (layout: Layout, at?: number | null) => void;
  dupSlide: (i: number) => void;
  delSlide: (i: number) => void;
  moveSlide: (from: number, to: number) => void;

  loadProjects: () => Promise<void>;
  openProject: (id: string) => Promise<void>;
  createProject: (title: string, slides: Slide[], cfg: GenerateConfig) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  backToStories: () => Promise<void>;
  newStory: () => void;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const useStudio = create<StudioState>()((set, get) => ({
  view: "stories",
  loading: true,
  projects: [],
  currentId: null,
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
  saveState: "saved",

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
      let current = s.current;
      if (current === from) current = to;
      else if (from < current && to >= current) current -= 1;
      else if (from > current && to <= current) current += 1;
      return { slides, current };
    }),

  loadProjects: async () => {
    try {
      const { projects } = await api<{ projects: ProjectSummary[] }>("/api/projects");
      set({ projects, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: `Couldn't load stories: ${e instanceof Error ? e.message : e}. Is Supabase running? (supabase start)`,
      });
    }
  },

  openProject: async (id) => {
    try {
      const p = await api<Project>(`/api/projects/${id}`);
      set({
        currentId: p.id,
        slides: p.slides,
        meta: p.meta,
        current: 0,
        view: "lineup",
        error: "",
        saveState: "saved",
      });
    } catch (e) {
      set({ error: `Couldn't open story: ${e instanceof Error ? e.message : e}` });
    }
  },

  createProject: async (title, slides, cfg) => {
    const meta: Meta = {
      title,
      brand: cfg.brand,
      tone: cfg.tone,
      story: cfg.story,
      points: cfg.points,
      cta: cfg.cta,
    };
    const p = await api<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ title, meta, slides }),
    });
    set({
      currentId: p.id,
      slides: p.slides,
      meta: p.meta,
      current: 0,
      view: "lineup",
      saveState: "saved",
    });
    void get().loadProjects();
  },

  deleteProject: async (id) => {
    try {
      await api(`/api/projects/${id}`, { method: "DELETE" });
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
        ...(s.currentId === id ? { currentId: null, slides: [], view: "stories" as View } : {}),
      }));
    } catch (e) {
      set({ error: `Couldn't delete story: ${e instanceof Error ? e.message : e}` });
    }
  },

  duplicateProject: async (id) => {
    try {
      const p = await api<Project>(`/api/projects/${id}`);
      // deep-clone slides with fresh ids so the copy is fully independent
      const slides = p.slides.map((sl) => ({ ...structuredClone(sl), id: uid() }));
      await api<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ title: `${p.title} copy`, meta: p.meta, slides }),
      });
      await get().loadProjects();
    } catch (e) {
      set({ error: `Couldn't duplicate story: ${e instanceof Error ? e.message : e}` });
    }
  },

  backToStories: async () => {
    await flushSave();
    set({ view: "stories", currentId: null, slides: [], current: 0 });
    void get().loadProjects();
  },

  newStory: () =>
    set({ view: "compose", currentId: null, slides: [], meta: defaultMeta, error: "" }),
}));

// ---- debounced autosave: any slides/meta change on an open project → PUT ----
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: { id: string; title: string; meta: Meta; slides: Slide[] } | null = null;

async function doSave() {
  if (!pendingSave) return;
  const payload = pendingSave;
  pendingSave = null;
  useStudio.setState({ saveState: "saving" });
  try {
    await api(`/api/projects/${payload.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: payload.title,
        meta: payload.meta,
        slides: payload.slides,
      }),
    });
    if (!pendingSave) useStudio.setState({ saveState: "saved" });
  } catch {
    useStudio.setState({ saveState: "error" });
  }
}

export async function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await doSave();
}

useStudio.subscribe((state, prev) => {
  if (!state.currentId) return;
  if (state.slides === prev.slides && state.meta === prev.meta) return;
  if (state.currentId !== prev.currentId) return; // just loaded, nothing to save
  pendingSave = {
    id: state.currentId,
    title: state.meta.title || "Untitled carousel",
    meta: state.meta,
    slides: state.slides,
  };
  useStudio.setState({ saveState: "saving" });
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void doSave();
  }, 600);
});
