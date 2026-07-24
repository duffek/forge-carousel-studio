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
    return await domToPng(el, {
      width: EXPORT_W,
      height: EXPORT_H,
      scale: 1,
      backgroundColor: "#000",
      style: { transform: "none" },
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
