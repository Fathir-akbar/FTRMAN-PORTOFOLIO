"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const NAV_LINKS = [
  { href: "#hero", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#closing", label: "Contact" },
];

type NavbarProps = { darkMode: boolean; onToggleTheme: () => void };

export default function Navbar({ darkMode, onToggleTheme }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const capsuleDark = scrolled && darkMode;
  const capsuleLight = scrolled && !darkMode;

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 sm:px-6">
      <div
        className={`pointer-events-auto flex w-full items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? `mt-3 h-12 max-w-[min(92vw,42rem)] rounded-full px-6 shadow-2xl backdrop-blur-xl backdrop-saturate-150 ${
                darkMode
                  ? "bg-white/[0.06] shadow-black/50"
                  : "bg-white/75 shadow-black/10"
              }`
            : "h-16 max-w-6xl px-6"
        }`}
      >
        <a href="#hero" aria-label="FTRMAN home" className="block">
          <Image
            src={capsuleLight ? "/images/FTR.png" : "/images/FTR-WHITEMODE.png"}
            alt="FTRMAN"
            width={72}
            height={40}
            className={`w-auto object-contain transition-all duration-500 ${
              scrolled ? "h-7" : "h-9"
            }`}
          />
        </a>
        <div
          className={`hidden gap-8 text-sm font-medium transition-colors duration-500 sm:flex ${
            !scrolled ? "text-white/85" : capsuleDark ? "text-white/80" : "text-black/75"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle light and dark mode"
          className={`flex h-9 items-center rounded-full border p-1 transition-all duration-500 ${
            scrolled ? "w-14" : "w-16"
          } ${
            !scrolled
              ? "border-white/30 bg-white/15"
              : capsuleDark
                ? "border-white/20 bg-white/10"
                : "border-black/15 bg-black/5"
          }`}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-transform duration-500 ${darkMode ? (scrolled ? "translate-x-5 bg-black text-white" : "translate-x-7 bg-black text-white") : "translate-x-0 bg-white text-amber-500"}`}
          >
            {darkMode ? "☾" : "☀"}
          </span>
        </button>
      </div>
    </nav>
  );
}
