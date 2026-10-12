"use client";

import { useEffect, useRef, useState } from "react";
import {
  siCss,
  siFigma,
  siHtml5,
  siJavascript,
  siNextdotjs,
  siReact,
  siTailwindcss,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";
import Reveal from "./Reveal";

type Skill = { name: string; level: number } & (
  | { icon: SimpleIcon }
  | { img: string }
);

const SKILLS: Skill[] = [
  { name: "Figma", icon: siFigma, level: 95 },
  { name: "Canva", img: "/images/skills/canva.svg", level: 90 },
  { name: "HTML", icon: siHtml5, level: 85 },
  { name: "CSS", icon: siCss, level: 80 },
  { name: "JavaScript", icon: siJavascript, level: 30 },
  { name: "Tailwind CSS", icon: siTailwindcss, level: 20 },
  { name: "Next.js", icon: siNextdotjs, level: 20 },
  { name: "React", icon: siReact, level: 20 },
];

type SkillsProps = { darkMode: boolean };

export default function Skills({ darkMode }: SkillsProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="skills"
      className={`relative z-10 w-full px-6 py-20 text-center ${darkMode ? "bg-black" : "bg-white"}`}
    >
      <Reveal>
        <div className="mx-auto max-w-5xl">
          <h2 className={`mb-2 text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
            Skills
          </h2>
          <p className={`mb-10 text-sm ${darkMode ? "text-white/60" : "text-black/50"}`}>
            Teknologi yang aku pakai
          </p>
          <div
            ref={gridRef}
            className="grid grid-cols-2 gap-4 text-left sm:grid-cols-3 lg:grid-cols-4"
          >
            {SKILLS.map((skill, index) => (
              <div
                key={skill.name}
                className={`rounded-2xl border p-4 transition-colors ${
                  darkMode
                    ? "border-white/10 bg-white/5 hover:border-accent/50"
                    : "border-black/10 bg-black/5 hover:border-accent/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                    {"img" in skill ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local SVG logo; next/image requires special SVG config
                      <img
                        src={skill.img}
                        alt={skill.name}
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <svg
                        role="img"
                        aria-label={skill.icon.title}
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill={`#${skill.icon.hex}`}
                      >
                        <path d={skill.icon.path} />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm font-semibold ${darkMode ? "text-white/90" : "text-black/80"}`}>
                    {skill.name}
                  </span>
                  <span
                    className={`ml-auto text-xs font-bold tabular-nums ${darkMode ? "text-accent" : "text-accent-ink"}`}
                  >
                    {skill.level}%
                  </span>
                </div>
                <div
                  className={`mt-4 h-1.5 w-full overflow-hidden rounded-full ${
                    darkMode ? "bg-white/10" : "bg-black/10"
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-700 ease-out"
                    style={{
                      width: inView ? `${skill.level}%` : "0%",
                      transitionDelay: `${index * 75}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}