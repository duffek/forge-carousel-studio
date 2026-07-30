"use client";

import { CSSProperties, ReactNode, useEffect, useRef } from "react";
import type { Slide, SlideImage, ThemeId } from "@/lib/types";
import { PH_PALETTES, hashStr, pad2 } from "@/lib/slides";
import { themeOf } from "@/lib/themes";

// parse *emphasis* -> orange italic
export function renderEmph(text: string | undefined | null): ReactNode[] {
  return String(text ?? "")
    .split(/(\*[^*]+\*)/g)
    .map((s, i) =>
      s.length > 1 && s.startsWith("*") && s.endsWith("*") ? (
        <em key={i} className="em">
          {s.slice(1, -1)}
        </em>
      ) : (
        <span key={i}>{s}</span>
      ),
    );
}

// contentEditable plain-text field: blur writes back to state
export function Editable({
  value,
  onChange,
  className,
  placeholder,
  style,
}: {
  value: string;
  onChange: (text: string) => void;
  className?: string;
  placeholder?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerText !== (value || "")) {
      ref.current.innerText = value || "";
    }
  }, [value]);
  return (
    <div
      ref={ref}
      className={className}
      style={style}
      contentEditable
      suppressContentEditableWarning
      data-ph={placeholder || ""}
      onBlur={(e) => onChange(e.currentTarget.innerText)}
    />
  );
}

type TextField = "kicker" | "headline" | "body";

// A text node: editable in edit mode, emphasis-rendered otherwise
function T({
  slide,
  field,
  cls,
  ph,
  editable,
  onPatch,
}: {
  slide: Slide;
  field: TextField;
  cls: string;
  ph: string;
  editable?: boolean;
  onPatch?: (field: TextField, text: string) => void;
}) {
  const v = slide[field] || "";
  if (editable) {
    return (
      <Editable
        className={cls}
        value={v}
        placeholder={ph}
        onChange={(t) => onPatch?.(field, t)}
      />
    );
  }
  return <div className={cls}>{renderEmph(v)}</div>;
}

const SWIPE = (
  <svg className="arrow" viewBox="0 0 60 50" fill="none">
    <path
      d="M55 42 C 38 42, 20 32, 10 12 M10 12 L 4 22 M10 12 L 20 16"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ---- image element (photo or editorial placeholder) ----
export function ImageArea({
  image,
  className,
}: {
  image?: SlideImage;
  className?: string;
}) {
  if (image?.dataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={"user-img " + (className || "")}
        src={image.dataUrl}
        alt=""
        style={{ opacity: image.opacity ?? 1 }}
      />
    );
  }
  const pal = PH_PALETTES[hashStr(image?.prompt || "x") % PH_PALETTES.length];
  return (
    <div
      className={"ph " + (className || "")}
      style={{ "--ph-a": pal[0], "--ph-b": pal[1] } as CSSProperties}
    >
      <div className="stripes"></div>
      <div className="grain"></div>
      <div className="frame"></div>
      <div className="pcorner">Nano Banana Pro</div>
      <div className="plabel">
        {image?.prompt
          ? "“" + image.prompt + "”"
          : "No image yet — add a prompt below and Generate"}
      </div>
    </div>
  );
}

// ---- the slide ----
export default function SlideView({
  slide,
  index,
  total,
  brand,
  theme,
  editable,
  onPatch,
}: {
  slide: Slide;
  index: number;
  total: number;
  brand?: string;
  theme?: ThemeId;
  editable?: boolean;
  onPatch?: (field: TextField, text: string) => void;
}) {
  const t = themeOf(theme);
  const svStyle = {
    "--hscale": slide.hScale ?? 1,
    "--bscale": slide.bScale ?? 1,
  } as CSSProperties;
  const wm = (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="wordmark-logo" src={t.wordmark} alt={brand || t.name} />
  );
  const counter = (
    <div className="counter">
      {pad2(index + 1)} / {pad2(total)}
    </div>
  );
  const swipe =
    index < total - 1 ? (
      <div className="swipe">
        {SWIPE}
        swipe
      </div>
    ) : null;
  const p = onPatch;

  if (slide.layout === "cover") {
    return (
      <div className="slide" data-layout="cover" data-theme={t.id} style={svStyle}>
        <div className="cover">
          <div className="photo">
            <ImageArea image={slide.image} />
          </div>
          <div className="inner">
            <T slide={slide} field="kicker" cls="kicker" ph="Kicker line" editable={editable} onPatch={p} />
            <T slide={slide} field="headline" cls="accent xxl" ph="BIG HEADLINE" editable={editable} onPatch={p} />
            <T slide={slide} field="body" cls="body small" ph="Supporting line…" editable={editable} onPatch={p} />
          </div>
          {slide.wordmark && wm}
          <div className="swipe" style={{ left: "auto", right: "calc(var(--u) * 5.5)" }}>
            swipe
          </div>
        </div>
        {counter}
      </div>
    );
  }

  if (slide.layout === "statement") {
    return (
      <div className="slide" data-layout="statement" data-theme={t.id} style={svStyle}>
        <div className="beat">
          <T slide={slide} field="kicker" cls="body" ph="Setup line" editable={editable} onPatch={p} />
          <T slide={slide} field="headline" cls="accent xl" ph="THE BOLD POINT" editable={editable} onPatch={p} />
          <T slide={slide} field="body" cls="body" ph="Land the point…" editable={editable} onPatch={p} />
        </div>
        {swipe}
        {counter}
      </div>
    );
  }

  if (slide.layout === "split") {
    return (
      <div className="slide" data-layout="split" data-theme={t.id} style={svStyle}>
        <div className="composite">
          <div className="top">
            <T slide={slide} field="kicker" cls="body" ph="Setup line" editable={editable} onPatch={p} />
            <T slide={slide} field="headline" cls="accent md" ph="THE POINT" editable={editable} onPatch={p} />
            <T slide={slide} field="body" cls="body small" ph="Supporting detail…" editable={editable} onPatch={p} />
            {slide.bullets && slide.bullets.length > 0 && (
              <div className="bullets">
                {slide.bullets.map((b, i) => (
                  <div className="brow" key={i}>
                    {renderEmph(b)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="photo">
            <ImageArea image={slide.image} />
          </div>
        </div>
        {swipe}
        {counter}
      </div>
    );
  }

  // closer
  return (
    <div className="slide" data-layout="closer" data-theme={t.id} style={svStyle}>
      <div className="cover closer">
        <div className="photo">
          <ImageArea image={slide.image} />
        </div>
        <div className="inner">
          <T slide={slide} field="headline" cls="accent xl" ph="CLOSING LINE" editable={editable} onPatch={p} />
          <div className="divider"></div>
          <T slide={slide} field="body" cls="body small" ph="Call to action…" editable={editable} onPatch={p} />
        </div>
        {slide.wordmark && wm}
      </div>
      {counter}
    </div>
  );
}
