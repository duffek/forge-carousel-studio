"use client";

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { domToPng } from "modern-screenshot";
import SlideView from "@/components/SlideView";
import type { Slide } from "./types";
import { pad2 } from "./slides";

export const EXPORT_W = 1080;
export const EXPORT_H = 1350;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Inline the app's own @font-face rules (self-hosted woff2) as data URLs so the
// rasterizer's SVG lays text out with the real fonts, not metric-adjusted
// fallbacks — fallback metrics differ slightly and flip line-wrap decisions.
let fontCssPromise: Promise<string> | null = null;
async function buildFontCss(): Promise<string> {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      let text = rule.cssText;
      const urls = [...text.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
      for (const u of urls) {
        try {
          const abs = new URL(u, sheet.href || location.href).href;
          const buf = await fetch(abs).then((r) => r.arrayBuffer());
          let bin = "";
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          text = text.split(u).join("data:font/woff2;base64," + btoa(bin));
        } catch {
          /* leave the original url */
        }
      }
      css += text + "\n";
    }
  }
  return css;
}
function getFontCss(): Promise<string> {
  if (!fontCssPromise) fontCssPromise = buildFontCss();
  return fontCssPromise;
}

// Render the slide off-screen at exactly 1080×1350 and rasterize it.
export async function renderPng(
  slide: Slide,
  index: number,
  total: number,
  brand: string,
): Promise<string> {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${EXPORT_W}px;height:${EXPORT_H}px;background:#000;z-index:-1`;
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(
    createElement(SlideView, { slide, index, total, brand, editable: false }),
  );
  try {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
    await wait(200);
    const el = host.querySelector<HTMLElement>(".slide");
    if (!el) throw new Error("Slide failed to render for export");
    el.style.width = EXPORT_W + "px";
    el.style.height = EXPORT_H + "px";
    el.style.aspectRatio = "auto";
    // Pin the slide unit to a fixed px value so the rasterizer's DOM clone
    // doesn't re-resolve container-query units.
    el.style.setProperty("--u", EXPORT_W / 100 + "px");
    await wait(50); // let the pinned unit re-layout before capture
    const cssText = await getFontCss();
    return await domToPng(el, {
      width: EXPORT_W,
      height: EXPORT_H,
      scale: 1,
      backgroundColor: "#000",
      font: cssText ? { cssText } : undefined,
      style: { transform: "none" },
      // The clone freezes each bullet span at its exact pixel width, so any
      // sub-pixel metric difference during SVG rasterization wraps the text
      // and overlaps the rows. Un-freeze those boxes; the row (with plenty of
      // slack) constrains layout instead.
      onCloneNode: (cloned) => {
        if (cloned instanceof Element) {
          cloned.querySelectorAll(".brow span, .brow em").forEach((n) => {
            const s = (n as HTMLElement).style;
            s.width = "auto";
            s.height = "auto";
          });
        }
      },
    });
  } finally {
    root.unmount();
    host.remove();
  }
}

export function download(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function slideFilename(title: string, index: number) {
  const slug = (title || "carousel").replace(/\s+/g, "-").toLowerCase();
  return `${slug}-${pad2(index + 1)}.png`;
}
