"use client";

import type { ThemeId } from "@/lib/types";
import { THEMES, THEME_IDS } from "@/lib/themes";

export default function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
}) {
  return (
    <div className="theme-chips">
      {THEME_IDS.map((id) => {
        const t = THEMES[id];
        return (
          <button
            key={id}
            type="button"
            className={value === id ? "on" : ""}
            onClick={() => onChange(id)}
            title={t.name}
          >
            <span className="sw">
              {t.swatch.map((c, i) => (
                <i key={i} style={{ background: c }} />
              ))}
            </span>
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
