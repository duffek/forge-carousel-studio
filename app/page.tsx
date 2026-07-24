"use client";

import { useCallback, useEffect } from "react";
import Compose from "@/components/Compose";
import Editor from "@/components/Editor";
import Lineup from "@/components/Lineup";
import TopBar from "@/components/TopBar";
import { download, renderPng, slideFilename } from "@/lib/export";
import { HAS_IMAGE } from "@/lib/slides";
import { useStudio } from "@/lib/store";
import type { GenerateConfig, Slide } from "@/lib/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function requestImage(prompt: string): Promise<string> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = (await res.json()) as { dataUrl?: string; error?: string };
  if (!res.ok || !data.dataUrl) {
    throw new Error(data.error || `Image generation failed (${res.status})`);
  }
  return data.dataUrl;
}

export default function Home() {
  const st = useStudio();

  // Fallback for the hydration gate: persist's rehydrate callback fires during
  // store creation; if it was missed for any reason, release the gate on mount.
  useEffect(() => {
    useStudio.getState().finishHydration();
  }, []);

  const onGenerate = useCallback(
    async (cfg: GenerateConfig) => {
      const { setBusy, setBusyStep, setError, setCarousel } = useStudio.getState();
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
        setBusyStep("Assembling carousel…");
        if (!data.slides?.length) throw new Error("No slides returned");
        setCarousel(data.title || "Untitled carousel", data.slides, cfg);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        useStudio
          .getState()
          .setError(`Generation failed: ${msg}. Try again or tweak your story.`);
      } finally {
        useStudio.getState().setBusy(false);
        useStudio.getState().setBusyStep("");
      }
    },
    [],
  );

  const genImage = useCallback(async (id: string) => {
    const { slides, setGenId, patchImage, setError } = useStudio.getState();
    const s = slides.find((x) => x.id === id);
    if (!s?.image) return;
    setGenId(id, true);
    try {
      const url = await requestImage(s.image.prompt);
      patchImage(id, { dataUrl: url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Image generation failed: ${msg}`);
    } finally {
      useStudio.getState().setGenId(id, false);
    }
  }, []);

  const genAll = useCallback(async () => {
    const { slides, setGenAll, patchImage } = useStudio.getState();
    const todo = slides.filter((s) => HAS_IMAGE[s.layout] && !s.image?.dataUrl);
    setGenAll(true);
    for (let i = 0; i < todo.length; i++) {
      useStudio.getState().setGenAll(true, `${i + 1}/${todo.length}`);
      try {
        const url = await requestImage(todo[i].image!.prompt);
        patchImage(todo[i].id, { dataUrl: url });
      } catch {
        /* keep going; per-slide failures leave the placeholder */
      }
    }
    useStudio.getState().setGenAll(false);
  }, []);

  const uploadImage = useCallback((id: string, file: File) => {
    const r = new FileReader();
    r.onload = (e) =>
      useStudio.getState().patchImage(id, { dataUrl: e.target?.result as string });
    r.readAsDataURL(file);
  }, []);

  const exportOne = useCallback(async (i: number) => {
    const { slides, meta, setExportBusy, setError } = useStudio.getState();
    setExportBusy(true);
    try {
      const url = await renderPng(slides[i], i, slides.length, meta.brand);
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
        const url = await renderPng(slides[i], i, slides.length, meta.brand);
        download(url, slideFilename(meta.title, i));
        await wait(220);
      }
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      useStudio.getState().setExportBusy(false);
    }
  }, []);

  const onNewStory = useCallback(() => {
    if (
      confirm(
        "Start a new carousel? Your current one stays saved in this browser until you generate a new one.",
      )
    ) {
      useStudio.getState().setView("compose");
    }
  }, []);

  // Avoid hydration mismatch: render the shell only after the store rehydrates.
  if (!st.hasHydrated) {
    return <div className="app" />;
  }

  return (
    <div className="app">
      <TopBar
        view={st.view}
        meta={st.meta}
        slideCount={st.slides.length}
        current={st.current}
        onBackToLineup={() => st.setView("lineup")}
      />

      <div className="view">
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
            onNewStory={onNewStory}
          />
        )}
        {st.view === "editor" && (
          <Editor
            slides={st.slides}
            meta={st.meta}
            current={st.current}
            setCurrent={st.setCurrent}
            onPatch={st.patchSlide}
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
