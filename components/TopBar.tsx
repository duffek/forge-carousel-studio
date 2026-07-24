"use client";

import type { Meta, View } from "@/lib/types";

export default function TopBar({
  view,
  meta,
  slideCount,
  current,
  onBackToLineup,
}: {
  view: View;
  meta: Meta;
  slideCount: number;
  current: number;
  onBackToLineup: () => void;
}) {
  const crumb =
    view === "compose" ? (
      <span>New carousel</span>
    ) : view === "lineup" ? (
      <span>
        <b>{meta.title || "Carousel"}</b> · Lineup
      </span>
    ) : (
      <span onClick={onBackToLineup} style={{ cursor: "pointer" }}>
        <b>{meta.title || "Carousel"}</b> · Editing slide {current + 1}
      </span>
    );

  return (
    <div className="topbar">
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/ff-logo.png" alt="FoundersForge" />
        <span className="sub">Carousel Studio</span>
      </div>
      <div className="sep"></div>
      <div className="crumb">{crumb}</div>
      <div className="spacer"></div>
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
