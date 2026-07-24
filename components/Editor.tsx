"use client";

import { CSSProperties, useRef, useState } from "react";
import type { Layout, Meta, Slide, SlideImage } from "@/lib/types";
import { HAS_IMAGE, LAYOUTS, LAYOUT_LABEL, pad2 } from "@/lib/slides";
import SlideView from "./SlideView";

export default function Editor({
  slides,
  meta,
  current,
  setCurrent,
  onPatch,
  onPatchImage,
  onGenImage,
  genBusy,
  onUpload,
  onExit,
  onAdd,
  onDup,
  onDelete,
  onMove,
  onExportOne,
  exportBusy,
}: {
  slides: Slide[];
  meta: Meta;
  current: number;
  setCurrent: (i: number) => void;
  onPatch: (id: string, patch: Partial<Slide>) => void;
  onPatchImage: (id: string, patch: Partial<SlideImage>) => void;
  onGenImage: (id: string) => void;
  genBusy: boolean;
  onUpload: (id: string, file: File) => void;
  onExit: () => void;
  onAdd: (layout: Layout, at?: number | null) => void;
  onDup: (i: number) => void;
  onDelete: (i: number) => void;
  onMove: (from: number, to: number) => void;
  onExportOne: (i: number) => void;
  exportBusy: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragI, setDragI] = useState(-1);
  const [overI, setOverI] = useState(-1);
  const s = slides[current];
  if (!s) return null;

  const drop = (to: number) => {
    if (dragI >= 0 && dragI !== to) onMove(dragI, to);
    setDragI(-1);
    setOverI(-1);
  };
  const hasImg = HAS_IMAGE[s.layout];
  const total = slides.length;

  const patch = (f: keyof Slide, v: unknown) => onPatch(s.id, { [f]: v });
  const bulletsText = (s.bullets || []).join("\n");

  return (
    <div className="editor">
      <div className="ed-top">
        <button className="btn ghost sm" onClick={onExit}>
          ‹ All slides
        </button>
        <span className="idx">
          {pad2(current + 1)} / {pad2(total)}
        </span>
        <span
          className="sep"
          style={{ width: 1, height: 20, background: "var(--line)" }}
        ></span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          {LAYOUT_LABEL[s.layout]}
        </span>
        <span className="spacer"></span>
        <button className="btn ghost sm" onClick={() => onDup(current)}>
          Duplicate
        </button>
        <button className="btn ghost sm danger" onClick={() => onDelete(current)}>
          Delete
        </button>
        <button
          className="btn sm"
          disabled={exportBusy}
          onClick={() => onExportOne(current)}
        >
          {exportBusy && <span className="spinner"></span>}Save PNG
        </button>
      </div>

      <div className="ed-body">
        <div className="ed-main" style={{ position: "relative" }}>
          <button
            className="ed-nav prev"
            disabled={current === 0}
            onClick={() => setCurrent(current - 1)}
          >
            ‹
          </button>
          <button
            className="ed-nav next"
            disabled={current === total - 1}
            onClick={() => setCurrent(current + 1)}
          >
            ›
          </button>

          <div className="stage-slide">
            <SlideView
              slide={s}
              index={current}
              total={total}
              brand={meta.brand}
              editable={true}
              onPatch={(f, t) => patch(f, t)}
            />
          </div>

          {hasImg ? (
            <div className="imgbar">
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(s.id, f);
                  e.target.value = "";
                }}
              />
              <textarea
                className="prompt"
                rows={2}
                placeholder="Describe the image for Nano Banana Pro…"
                value={s.image?.prompt ?? ""}
                onChange={(e) => onPatchImage(s.id, { prompt: e.target.value })}
              />
              <button
                className="btn ghost sm"
                onClick={() => fileRef.current?.click()}
              >
                Upload
              </button>
              <button
                className="btn primary"
                style={{ alignSelf: "stretch" }}
                disabled={genBusy}
                onClick={() => onGenImage(s.id)}
              >
                {genBusy ? <span className="spinner dark"></span> : "✦"}{" "}
                {genBusy ? "Generating…" : "Generate image"}
              </button>
            </div>
          ) : (
            <div className="imgbar">
              <div className="disabled-note">
                Statement slides are text-only — switch layout in the panel to add
                an image.
              </div>
            </div>
          )}
        </div>

        <div className="inspector">
          <div className="insp-sec">
            <div className="h">Layout</div>
            <div className="chips">
              {LAYOUTS.map((l) => (
                <button
                  key={l}
                  className={s.layout === l ? "on" : ""}
                  onClick={() =>
                    onPatch(s.id, {
                      layout: l,
                      wordmark:
                        l === "cover" || l === "closer" ? s.wordmark : s.wordmark,
                      ...(HAS_IMAGE[l] && !s.image
                        ? {
                            image: {
                              prompt: "",
                              dataUrl: null,
                              opacity: l === "closer" ? 0.3 : 1,
                            },
                          }
                        : {}),
                    })
                  }
                >
                  {LAYOUT_LABEL[l]}
                </button>
              ))}
            </div>
          </div>

          <div className="insp-sec">
            <div className="h">Content</div>
            <div className="insp-field">
              <label>Kicker</label>
              <input
                value={s.kicker || ""}
                onChange={(e) => patch("kicker", e.target.value)}
                placeholder="Small setup line"
              />
            </div>
            <div className="insp-field">
              <label>
                Headline{" "}
                <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>
                  · Enter for new line
                </span>
              </label>
              <textarea
                rows={3}
                value={s.headline || ""}
                onChange={(e) => patch("headline", e.target.value)}
                placeholder="THE BOLD POINT"
              />
            </div>
            <div className="insp-field">
              <label>
                Body{" "}
                <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>
                  · wrap *word* for orange
                </span>
              </label>
              <textarea
                rows={3}
                value={s.body || ""}
                onChange={(e) => patch("body", e.target.value)}
                placeholder="Supporting sentence…"
              />
            </div>
            {s.layout === "split" && (
              <div className="insp-field">
                <label>
                  Bullets{" "}
                  <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>
                    · one per line
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={bulletsText}
                  onChange={(e) =>
                    patch(
                      "bullets",
                      e.target.value ? e.target.value.split("\n") : [],
                    )
                  }
                  placeholder={"First point\nSecond point"}
                />
              </div>
            )}
          </div>

          <div className="insp-sec">
            <div className="h">Type size</div>
            <div className="insp-field">
              <label>Headline · {Math.round((s.hScale ?? 1) * 100)}%</label>
              <input
                type="range"
                min={0.55}
                max={1.6}
                step={0.05}
                style={
                  {
                    width: "100%",
                    "--fill": (((s.hScale ?? 1) - 0.55) / 1.05) * 100 + "%",
                  } as CSSProperties
                }
                value={s.hScale ?? 1}
                onChange={(e) => patch("hScale", +e.target.value)}
              />
            </div>
            <div className="insp-field">
              <label>Body · {Math.round((s.bScale ?? 1) * 100)}%</label>
              <input
                type="range"
                min={0.55}
                max={1.6}
                step={0.05}
                style={
                  {
                    width: "100%",
                    "--fill": (((s.bScale ?? 1) - 0.55) / 1.05) * 100 + "%",
                  } as CSSProperties
                }
                value={s.bScale ?? 1}
                onChange={(e) => patch("bScale", +e.target.value)}
              />
            </div>
            <div className="insp-actions">
              <button
                className="btn ghost sm"
                onClick={() => onPatch(s.id, { hScale: 1, bScale: 1 })}
              >
                Reset sizes
              </button>
            </div>
          </div>

          {hasImg && (
            <div className="insp-sec">
              <div className="h">Image</div>
              <div className="insp-field">
                <label>Prompt</label>
                <textarea
                  rows={3}
                  value={s.image?.prompt ?? ""}
                  onChange={(e) => onPatchImage(s.id, { prompt: e.target.value })}
                  placeholder="Moody editorial photo of…"
                />
              </div>
              <div className="insp-field">
                <label>
                  Opacity · {Math.round((s.image?.opacity ?? 1) * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  style={
                    {
                      width: "100%",
                      "--fill": (((s.image?.opacity ?? 1) - 0.1) / 0.9) * 100 + "%",
                    } as CSSProperties
                  }
                  value={s.image?.opacity ?? 1}
                  onChange={(e) => onPatchImage(s.id, { opacity: +e.target.value })}
                />
              </div>
              <div className="insp-actions">
                <button
                  className="btn ghost sm"
                  onClick={() => onPatchImage(s.id, { dataUrl: null })}
                >
                  Clear image
                </button>
              </div>
            </div>
          )}

          {(s.layout === "cover" || s.layout === "closer") && (
            <div className="insp-sec">
              <div className="h">Branding</div>
              <div className="toggle">
                Show wordmark
                <div
                  className={"switch" + (s.wordmark ? " on" : "")}
                  onClick={() => patch("wordmark", !s.wordmark)}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rail">
        {slides.map((sl, i) => (
          <div
            key={sl.id}
            className={
              "rthumb" +
              (i === current ? " on" : "") +
              (dragI === i ? " dragging" : "") +
              (overI === i ? " drag-over" : "")
            }
            onClick={() => setCurrent(i)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", String(i));
              e.dataTransfer.effectAllowed = "move";
              setDragI(i);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverI(i);
            }}
            onDragLeave={() => setOverI((o) => (o === i ? -1 : o))}
            onDrop={(e) => {
              e.preventDefault();
              drop(i);
            }}
            onDragEnd={() => {
              setDragI(-1);
              setOverI(-1);
            }}
          >
            <SlideView
              slide={sl}
              index={i}
              total={total}
              brand={meta.brand}
              editable={false}
            />
            <span className="n">{i + 1}</span>
          </div>
        ))}
        <button
          className="rail-add"
          title="Add slide"
          onClick={() => onAdd("statement", current + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
