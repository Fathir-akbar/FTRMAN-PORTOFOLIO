"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type IntroLine = { text: string; accent?: boolean };

export type IntroFrame = {
  eyebrow: string;
  lines: IntroLine[];
  hint: string;
};

type SectionIntroProps = {
  darkMode: boolean;
  ariaLabel: string;
  frames: readonly [IntroFrame, IntroFrame];
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function SectionIntro({
  darkMode,
  ariaLabel,
  frames,
}: SectionIntroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Scroll progress through the pinned area: 0 → frame 1, 1 → frame 2.
  useEffect(() => {
    if (reduceMotion) return;
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      setProgress(clamp01(-rect.top / travel));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduceMotion]);

  // Second frame fades/slides in over a wide window (30%–70%) of the
  // pinned scroll so the swap feels slow and smooth while scrolling.
  const f2 = smoothstep(0.3, 0.7, progress);
  const f1 = 1 - f2;

  const ink = darkMode ? "text-white" : "text-black";
  const faint = darkMode ? "text-white/50" : "text-black/50";
  const accent = darkMode ? "text-accent" : "text-accent-ink";
  const bg = darkMode ? "bg-black" : "bg-white";

  const renderLines = (lines: IntroLine[]) => (
    <>
      {lines.map((line, index) => (
        <span
          key={index}
          className={line.accent ? `block ${accent}` : "block"}
        >
          {line.text}
        </span>
      ))}
    </>
  );

  const [frameA, frameB] = frames;

  if (reduceMotion) {
    return (
      <section
        className={`relative z-10 w-full px-6 py-20 text-center ${bg} ${ink}`}
      >
        {frames.map((frame, index) => (
          <p
            key={index}
            className={`mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl ${
              index > 0 ? "mt-16" : ""
            }`}
          >
            {renderLines(frame.lines)}
          </p>
        ))}
      </section>
    );
  }

  const frameStyle = (index: number): CSSProperties => {
    if (index === 0) {
      return {
        opacity: f1,
        transform: `translate3d(0, ${f2 * -70}px, 0)`,
        willChange: "opacity, transform",
      };
    }
    return {
      opacity: f2,
      transform: `translate3d(0, ${(1 - f2) * 90}px, 0)`,
      willChange: "opacity, transform",
    };
  };

  return (
    <section
      ref={sectionRef}
      aria-label={ariaLabel}
      className={`relative z-10 w-full ${bg}`}
      style={{ height: "400vh" }}
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {frames.map((frame, index) => {
          const visible = index === 0 ? f1 > f2 : f2 >= f1;
          return (
            <div
              key={index}
              aria-hidden={!visible}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={frameStyle(index)}
            >
              <p
                className={`mb-6 text-xs font-bold uppercase tracking-[0.35em] ${accent}`}
              >
                {frame.eyebrow}
              </p>
              <h2
                className={`text-[clamp(2.6rem,8vw,7rem)] font-extrabold leading-[1.05] tracking-tight ${ink}`}
              >
                {renderLines(frame.lines)}
              </h2>
              <p
                className={`mt-8 flex items-center gap-2 text-sm ${faint}`}
                style={{ opacity: (index === 0 ? f1 : f2) * 0.9 }}
              >
                <span aria-hidden className="animate-bounce">
                  ↓
                </span>
                {frame.hint}
              </p>
            </div>
          );
        })}

        {/* Flipbook page indicator */}
        <div
          className={`absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] ${faint}`}
        >
          <span style={{ opacity: f2 > 0.5 ? 0.35 : 1 }}>01</span>
          <span
            className={`h-px w-12 overflow-hidden ${darkMode ? "bg-white/25" : "bg-black/20"}`}
          >
            <span
              className="block h-px w-full origin-left bg-accent"
              style={{ transform: `scaleX(${f2})` }}
            />
          </span>
          <span style={{ opacity: f2 > 0.5 ? 1 : 0.35 }}>02</span>
        </div>
      </div>
    </section>
  );
}
