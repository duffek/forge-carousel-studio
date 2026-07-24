"use client";

import { useState } from "react";
import type { Layout, Meta, Slide } from "@/lib/types";
import { HAS_IMAGE, LAYOUT_LABEL, pad2 } from "@/lib/slides";
import SlideView from "./SlideView";

export default function Lineup({
  slides,
  meta,
  onOpen,
  onAdd,
  onDup,
  onDelete,
  onMove,
  onPatchMeta,
  onGenAll,
  genAllBusy,
  genAllProgress,
  onExportAll,
  exportBusy,
  onNewStory,
}: {
  slides: Slide[];
  meta: Meta;
  onOpen: (i: number) => void;
  onAdd: (layout: Layout, at?: number | null) => void;
  onDup: (i: number) => void;
  onDelete: (i: number) => void;
  onMove: (from: number, to: number) => void;
  onPatchMeta: (patch: Partial<Meta>) => void;
  onGenAll: () => void;
  genAllBusy: boolean;
  genAllProgress: string;
  onExportAll: () => void;
  exportBusy: boolean;
  onNewStory: () => void;
}) {
  const [dragI, setDragI] = useState(-1);
  const [overI, setOverI] = useState(-1);
  const missing = slides.filter(
    (s) => HAS_IMAGE[s.layout] && !s.image?.dataUrl,
  ).length;

  const drop = (to: number) => {
    if (dragI >= 0 && dragI !== to) onMove(dragI, to);
    setDragI(-1);
    setOverI(-1);
  };

  return (
    <div className="lineup">
      <div className="lineup-head">
        <div>
          <div
            className="ttl"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onPatchMeta({ title: e.currentTarget.innerText })}
            dangerouslySetInnerHTML={{ __html: meta.title || "Untitled carousel" }}
          />
          <div className="sub">
            {slides.length} slides · {meta.tone} tone
            {missing > 0
              ? ` · ${missing} image${missing > 1 ? "s" : ""} to generate`
              : " · all images ready"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn ghost" onClick={onNewStory}>
            New story
          </button>
          <button className="btn" disabled={exportBusy} onClick={onExportAll}>
            {exportBusy && <span className="spinner"></span>}Export all PNGs
          </button>
        </div>
      </div>

      <div className="toolbar">
        <button
          className="btn primary"
          disabled={genAllBusy || missing === 0}
          onClick={onGenAll}
        >
          {genAllBusy && <span className="spinner dark"></span>}
          {genAllBusy
            ? `Generating ${genAllProgress}…`
            : missing === 0
              ? "All images generated"
              : `Generate all images (${missing})`}
        </button>
        <span
          className="meta"
          style={{
            fontFamily: "var(--font-mono-f)",
            fontSize: "11px",
            color: "var(--muted-2)",
          }}
        >
          Nano Banana Pro
        </span>
        <span className="spacer"></span>
        <button className="btn ghost sm" onClick={() => onAdd("statement")}>
          + Statement
        </button>
        <button className="btn ghost sm" onClick={() => onAdd("split")}>
          + Split
        </button>
      </div>

      <div className="grid">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={
              "card" +
              (dragI === i ? " dragging" : "") +
              (overI === i ? " drag-over" : "")
            }
            draggable
            onDragStart={() => setDragI(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverI(i);
            }}
            onDragLeave={() => setOverI((o) => (o === i ? -1 : o))}
            onDrop={() => drop(i)}
            onDragEnd={() => {
              setDragI(-1);
              setOverI(-1);
            }}
          >
            <div className="thumb" onClick={() => onOpen(i)}>
              <span className="badge">
                {pad2(i + 1)} · {LAYOUT_LABEL[s.layout]}
              </span>
              <SlideView
                slide={s}
                index={i}
                total={slides.length}
                brand={meta.brand}
                editable={false}
              />
              <div className="go">
                <span className="btn primary sm">Open editor</span>
              </div>
            </div>
            <div className="foot">
              <span className="lay">{LAYOUT_LABEL[s.layout]}</span>
              <button
                className="mini"
                title="Duplicate"
                onClick={() => onDup(i)}
              >
                ⧉
              </button>
              <button
                className="mini"
                title="Delete"
                onClick={() => onDelete(i)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <div className="card add" onClick={() => onAdd("statement")}>
          <span className="plus">+</span>
          <span>Add slide</span>
        </div>
      </div>
    </div>
  );
}
