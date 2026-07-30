"use client";

import { CSSProperties, useState } from "react";
import type { GenerateConfig, Meta, ThemeId, Tone } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/themes";
import ThemePicker from "./ThemePicker";

const TONES: Tone[] = ["Provocative", "Analytical", "Inspirational", "Story-driven"];

const EXAMPLE: GenerateConfig = {
  story:
    'Fortune called Jack Welch the "Manager of the Century." For 20 years at GE he ran a system he called the vitality curve — everyone else called it rank-and-yank: every year the bottom 10% of employees were fired, whether they were failing or not. He laid off over 100,000 people and earned the nickname Neutron Jack. GE\'s stock rose 14x under him — but so did the S&P 500 over the same window. He quietly turned GE into a giant bank that nearly collapsed in 2008. His disciples carried the playbook to Home Depot, Boeing, and Microsoft, often with disastrous results. Meanwhile Jim Sinegal built Costco on the opposite philosophy: pay people nearly double, never cut healthcare, give raises in downturns. Costco quietly outperformed. Near the end of his life, Welch admitted shareholder value was "the dumbest idea in the world."',
  points: 6,
  tone: "Provocative",
  brand: "FoundersForge",
  cta: "What kind of company are you building? Follow for more founder stories.",
};

export default function Compose({
  onGenerate,
  busy,
  busyStep,
  error,
  initial,
}: {
  onGenerate: (cfg: GenerateConfig) => void;
  busy: boolean;
  busyStep: string;
  error: string;
  initial: Meta;
}) {
  const [story, setStory] = useState(initial.story || "");
  const [points, setPoints] = useState(initial.points || 5);
  const [tone, setTone] = useState<Tone>(initial.tone || "Provocative");
  const [brand, setBrand] = useState(initial.brand || "FoundersForge");
  const [cta, setCta] = useState(initial.cta || "");
  const [theme, setTheme] = useState<ThemeId>(initial.theme || DEFAULT_THEME);
  const total = points + 2;

  return (
    <div className="compose">
      <div className="eyebrow">Carousel Studio</div>
      <h1>
        Turn a story into a
        <br />
        <span className="g">scroll-stopping carousel.</span>
      </h1>
      <p className="lede">
        Paste your story, choose how many bold points to make, and generate a full
        Instagram carousel — cover, punchy point slides, and a closer. Images are
        created on demand with Gemini Nano Banana&nbsp;Pro.
      </p>

      <div className="card-panel">
        <div className="fieldset">
          <div className="flabel">
            <span className="t">Your story</span>
            <span className="h">the raw material — a thread, an essay, notes</span>
          </div>
          <textarea
            className="input"
            rows={7}
            placeholder="Paste or write the story you want to turn into a carousel…"
            value={story}
            onChange={(e) => setStory(e.target.value)}
          />
          <div className="hintline">
            Tip: richer input = sharper slides.{" "}
            <a
              onClick={() => {
                setStory(EXAMPLE.story);
                setPoints(EXAMPLE.points);
                setTone(EXAMPLE.tone);
                setBrand(EXAMPLE.brand);
                setCta(EXAMPLE.cta);
              }}
              style={{ cursor: "pointer" }}
            >
              Load the Welch vs. Sinegal example →
            </a>
          </div>
        </div>

        <div className="fieldset">
          <div className="flabel">
            <span className="t">Bold points to cover</span>
            <span className="h">
              {total} slides total · cover + {points} points + closer
            </span>
          </div>
          <div className="stepper">
            <span className="num">{points}</span>
            <input
              type="range"
              min={3}
              max={10}
              value={points}
              style={{ "--fill": ((points - 3) / 7) * 100 + "%" } as CSSProperties}
              onChange={(e) => setPoints(+e.target.value)}
            />
          </div>
        </div>

        <div className="fieldset">
          <div className="flabel">
            <span className="t">Brand theme</span>
            <span className="h">colors, fonts &amp; wordmark — switchable later</span>
          </div>
          <ThemePicker value={theme} onChange={setTheme} />
        </div>

        <div className="row">
          <div className="fieldset">
            <div className="flabel">
              <span className="t">Tone</span>
            </div>
            <div className="seg">
              {TONES.map((t) => (
                <button
                  key={t}
                  className={tone === t ? "on" : ""}
                  onClick={() => setTone(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="fieldset">
            <div className="flabel">
              <span className="t">Brand / wordmark</span>
            </div>
            <input
              className="input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="FoundersForge"
            />
          </div>
        </div>

        <div className="fieldset">
          <div className="flabel">
            <span className="t">Closing call-to-action</span>
            <span className="h">optional</span>
          </div>
          <input
            className="input"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="e.g. Follow for more founder stories · Link in bio"
          />
        </div>

        {error && <div className="err">{error}</div>}

        <div className="compose-actions">
          <button
            className="btn primary lg"
            disabled={busy || !story.trim()}
            onClick={() => onGenerate({ story, points, tone, brand, cta, theme })}
          >
            {busy && <span className="spinner dark"></span>}
            {busy ? "Generating…" : "Generate carousel"}
          </button>
          {busy && (
            <div className="gen-status">
              <span>{busyStep || "Drafting slides…"}</span>
            </div>
          )}
          {!busy && (
            <span className="hintline" style={{ marginTop: 0 }}>
              You can edit everything after — nothing is final.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
