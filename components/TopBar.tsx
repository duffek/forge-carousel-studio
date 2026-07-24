"use client";

import type { Meta, View } from "@/lib/types";
import type { SaveState } from "@/lib/store";

export default function TopBar({
  view,
  meta,
  slideCount,
  current,
  saveState,
  onBackToLineup,
  onBackToStories,
}: {
  view: View;
  meta: Meta;
  slideCount: number;
  current: number;
  saveState: SaveState;
  onBackToLineup: () => void;
  onBackToStories: () => void;
}) {
  const storiesRoot = (
    <span
      onClick={onBackToStories}
      style={{ cursor: view === "stories" ? "default" : "pointer" }}
    >
      Stories
    </span>
  );

  const crumb =
    view === "stories" ? (
      <span>
        <b>Stories</b>
      </span>
    ) : view === "compose" ? (
      <span>
        {storiesRoot} · <b>New carousel</b>
      </span>
    ) : view === "lineup" ? (
      <span>
        {storiesRoot} · <b>{meta.title || "Carousel"}</b> · Lineup
      </span>
    ) : (
      <span>
        {storiesRoot} ·{" "}
        <span onClick={onBackToLineup} style={{ cursor: "pointer" }}>
          <b>{meta.title || "Carousel"}</b> · Editing slide {current + 1}
        </span>
      </span>
    );

  const saveLabel =
    view === "lineup" || view === "editor"
      ? saveState === "saving"
        ? "Saving…"
        : saveState === "error"
          ? "Save failed — is Supabase running?"
          : "Saved"
      : null;

  return (
    <div className="topbar">
      <div
        className="brand"
        onClick={onBackToStories}
        style={{ cursor: "pointer" }}
        title="All stories"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/ff-logo.png" alt="FoundersForge" />
        <span className="sub">Carousel Studio</span>
      </div>
      <div className="sep"></div>
      <div className="crumb">{crumb}</div>
      <div className="spacer"></div>
      {saveLabel && (
        <span
          className="meta"
          style={saveState === "error" ? { color: "#ff8a8a" } : undefined}
        >
          {saveLabel}
        </span>
      )}
      {view === "editor" && (
        <button className="btn ghost sm" onClick={onBackToLineup}>
          Done editing
        </button>
      )}
      {view === "lineup" && (
        <span className="meta">{slideCount} slides · 1080×1350</span>
      )}
    </div>
  );
}
