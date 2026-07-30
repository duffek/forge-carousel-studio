"use client";

import { useCallback, useEffect } from "react";
import Compose from "@/components/Compose";
import Editor from "@/components/Editor";
import Lineup from "@/components/Lineup";
import Stories from "@/components/Stories";
import TopBar from "@/components/TopBar";
import { download, renderPng, slideFilename } from "@/lib/export";
import { HAS_IMAGE } from "@/lib/slides";
import { LEGACY_LS_KEY, flushSave, useStudio } from "@/lib/store";
import { themeOf } from "@/lib/themes";
import type { GenerateConfig, Meta, Slide } from "@/lib/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function requestImage(
  projectId: string,
  slideId: string,
  prompt: string,
  styleHint: string,
): Promise<string> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, projectId, slideId, styleHint }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || `Image generation failed (${res.status})`);
  }
  return data.url;
}

async function storeDataUrl(
  projectId: string,
  slideId: string,
  dataUrl: string,
): Promise<string> {
  const res = await fetch("/api/upload-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId, slideId, dataUrl }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data.url;
}

// One-time migration of the pre-Supabase single-carousel localStorage blob.
// Single-flight + take-first: the key is claimed *before* any network call so
// StrictMode double-effects / remounts can't create duplicate projects.
let migrationStarted = false;
async function migrateLegacyStorage(): Promise<void> {
  if (migrationStarted) return;
  migrationStarted = true;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_LS_KEY);
    if (raw) localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as {
      state?: { slides?: Slide[]; meta?: Meta };
    };
    const slides = parsed.state?.slides ?? [];
    const meta = parsed.state?.meta;
    if (slides.length && meta) {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: meta.title || "Untitled carousel", meta, slides }),
      });
      const project = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !project.id) throw new Error(project.error || "migration failed");
      // Move inline data: images into storage, then persist the URL versions.
      let changed = false;
      for (const s of slides) {
        if (s.image?.dataUrl?.startsWith("data:")) {
          try {
            s.image.dataUrl = await storeDataUrl(project.id, s.id, s.image.dataUrl);
            changed = true;
          } catch {
            /* keep the inline copy if upload fails */
          }
        }
      }
      if (changed) {
        await fetch(`/api/projects/${project.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slides }),
        });
      }
    }
  } catch {
    // Migration failed — put the blob back so a later boot can retry.
    try {
      localStorage.setItem(LEGACY_LS_KEY, raw);
    } catch {
      /* quota — nothing more we can do */
    }
  }
}

export default function Home() {
  const st = useStudio();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await migrateLegacyStorage();
      if (!cancelled) await useStudio.getState().loadProjects();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onGenerate = useCallback(async (cfg: GenerateConfig) => {
    const { setBusy, setBusyStep, setError } = useStudio.getState();
    setBusy(true);
    setError("");
    setBusyStep("Reading your story…");
    try {
      setBusyStep("Drafting slides & image prompts…");
      const res = await fetch("/api/generate-carousel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = (await res.json()) as {
        title?: string;
        slides?: Slide[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      if (!data.slides?.length) throw new Error("No slides returned");
      setBusyStep("Assembling carousel…");
      await useStudio
        .getState()
        .createProject(data.title || "Untitled carousel", data.slides, cfg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      useStudio
        .getState()
        .setError(`Generation failed: ${msg}. Try again or tweak your story.`);
    } finally {
      useStudio.getState().setBusy(false);
      useStudio.getState().setBusyStep("");
    }
  }, []);

  const genImage = useCallback(async (id: string) => {
    const { slides, currentId, setGenId, patchImage, setError } = useStudio.getState();
    const s = slides.find((x) => x.id === id);
    if (!s?.image || !currentId) return;
    setGenId(id, true);
    try {
      const styleHint = themeOf(useStudio.getState().meta.theme).imageStyleHint;
      const url = await requestImage(currentId, id, s.image.prompt, styleHint);
      patchImage(id, { dataUrl: url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Image generation failed: ${msg}`);
    } finally {
      useStudio.getState().setGenId(id, false);
    }
  }, []);

  const genAll = useCallback(async () => {
    const { slides, currentId, setGenAll, patchImage } = useStudio.getState();
    if (!currentId) return;
    const todo = slides.filter((s) => HAS_IMAGE[s.layout] && !s.image?.dataUrl);
    setGenAll(true);
    for (let i = 0; i < todo.length; i++) {
      useStudio.getState().setGenAll(true, `${i + 1}/${todo.length}`);
      try {
        const styleHint = themeOf(useStudio.getState().meta.theme).imageStyleHint;
        const url = await requestImage(currentId, todo[i].id, todo[i].image!.prompt, styleHint);
        patchImage(todo[i].id, { dataUrl: url });
      } catch {
        /* keep going; per-slide failures leave the placeholder */
      }
    }
    useStudio.getState().setGenAll(false);
  }, []);

  const uploadImage = useCallback((id: string, file: File) => {
    const { currentId } = useStudio.getState();
    if (!currentId) return;
    const r = new FileReader();
    r.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      // show immediately, then swap for the stored URL
      useStudio.getState().patchImage(id, { dataUrl });
      try {
        const url = await storeDataUrl(currentId, id, dataUrl);
        useStudio.getState().patchImage(id, { dataUrl: url });
      } catch (err) {
        useStudio
          .getState()
          .setError(
            `Image upload failed: ${err instanceof Error ? err.message : err}`,
          );
      }
    };
    r.readAsDataURL(file);
  }, []);

  const exportOne = useCallback(async (i: number) => {
    const { slides, meta, setExportBusy, setError } = useStudio.getState();
    setExportBusy(true);
    try {
      const url = await renderPng(slides[i], i, slides.length, meta.brand, meta.theme);
      download(url, slideFilename(meta.title, i));
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      useStudio.getState().setExportBusy(false);
    }
  }, []);

  const exportAll = useCallback(async () => {
    const { slides, meta, setExportBusy, setError } = useStudio.getState();
    setExportBusy(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        const url = await renderPng(slides[i], i, slides.length, meta.brand, meta.theme);
        download(url, slideFilename(meta.title, i));
        await wait(220);
      }
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      useStudio.getState().setExportBusy(false);
    }
  }, []);

  const onDeleteProject = useCallback((id: string) => {
    if (confirm("Delete this story and its images? This can't be undone.")) {
      void useStudio.getState().deleteProject(id);
    }
  }, []);

  return (
    <div className="app">
      <TopBar
        view={st.view}
        meta={st.meta}
        slideCount={st.slides.length}
        current={st.current}
        saveState={st.saveState}
        onBackToLineup={() => {
          void flushSave();
          st.setView("lineup");
        }}
        onBackToStories={() => void st.backToStories()}
      />

      <div className="view">
        {st.view === "stories" && (
          <Stories
            projects={st.projects}
            loading={st.loading}
            error={st.error}
            onOpen={(id) => void st.openProject(id)}
            onNew={st.newStory}
            onDelete={onDeleteProject}
            onDuplicate={(id) => void st.duplicateProject(id)}
          />
        )}
        {st.view === "compose" && (
          <Compose
            onGenerate={onGenerate}
            busy={st.busy}
            busyStep={st.busyStep}
            error={st.error}
            initial={st.meta}
          />
        )}
        {st.view === "lineup" && (
          <Lineup
            slides={st.slides}
            meta={st.meta}
            onOpen={st.openEditor}
            onAdd={st.addSlide}
            onDup={st.dupSlide}
            onDelete={st.delSlide}
            onMove={st.moveSlide}
            onPatchMeta={st.patchMeta}
            onGenAll={genAll}
            genAllBusy={st.genAllBusy}
            genAllProgress={st.genAllProgress}
            onExportAll={exportAll}
            exportBusy={st.exportBusy}
            onBackToStories={() => void st.backToStories()}
          />
        )}
        {st.view === "editor" && (
          <Editor
            slides={st.slides}
            meta={st.meta}
            current={st.current}
            setCurrent={st.setCurrent}
            onPatch={st.patchSlide}
            onPatchMeta={st.patchMeta}
            onPatchImage={st.patchImage}
            onGenImage={genImage}
            genBusy={!!st.genIds[st.slides[st.current]?.id ?? ""]}
            onUpload={uploadImage}
            onExit={() => st.setView("lineup")}
            onAdd={st.addSlide}
            onDup={st.dupSlide}
            onDelete={st.delSlide}
            onMove={st.moveSlide}
            onExportOne={exportOne}
            exportBusy={st.exportBusy}
          />
        )}
      </div>
    </div>
  );
}
