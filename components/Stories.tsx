"use client";

import type { ProjectSummary } from "@/lib/types";
import SlideView from "./SlideView";

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Stories({
  projects,
  loading,
  error,
  onOpen,
  onNew,
  onDelete,
  onDuplicate,
}: {
  projects: ProjectSummary[];
  loading: boolean;
  error: string;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="lineup">
      <div className="lineup-head">
        <div>
          <div className="ttl" style={{ cursor: "default" }}>
            Your stories
          </div>
          <div className="sub">
            {loading
              ? "Loading…"
              : `${projects.length} ${projects.length === 1 ? "story" : "stories"} in progress`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn primary" onClick={onNew}>
            + New story
          </button>
        </div>
      </div>

      {error && <div className="err">{error}</div>}

      {!loading && projects.length === 0 && !error && (
        <div className="empty" style={{ height: "auto", padding: "90px 40px" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 34,
              textTransform: "uppercase",
              color: "var(--ink)",
            }}
          >
            No stories yet
          </div>
          <div style={{ maxWidth: 420, lineHeight: 1.5 }}>
            Paste a story and let Carousel Studio turn it into a scroll-stopping
            Instagram carousel.
          </div>
          <button className="btn primary lg" onClick={onNew}>
            Start your first story
          </button>
        </div>
      )}

      <div className="grid" style={{ marginTop: 26 }}>
        {projects.map((p) => (
          <div key={p.id} className="card">
            <div className="thumb" onClick={() => onOpen(p.id)}>
              {p.coverSlide ? (
                <SlideView
                  slide={p.coverSlide}
                  index={0}
                  total={p.slideCount}
                  editable={false}
                />
              ) : (
                <div className="empty" style={{ fontSize: 12 }}>
                  Empty story
                </div>
              )}
              <div className="go">
                <span className="btn primary sm">Open story</span>
              </div>
            </div>
            <div className="foot">
              <span className="lay" style={{ textTransform: "none" }}>
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                  {p.title || "Untitled carousel"}
                </span>
                <br />
                {p.slideCount} slides · {p.tone || "—"} · {timeAgo(p.updatedAt)}
              </span>
              <button
                className="mini"
                title="Duplicate story"
                onClick={() => onDuplicate(p.id)}
              >
                ⧉
              </button>
              <button
                className="mini"
                title="Delete story"
                onClick={() => onDelete(p.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {!loading && projects.length > 0 && (
          <div className="card add" onClick={onNew}>
            <span className="plus">+</span>
            <span>New story</span>
          </div>
        )}
      </div>
    </div>
  );
}
