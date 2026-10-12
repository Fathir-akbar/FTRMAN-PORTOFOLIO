"use client";

import { useEffect, useState } from "react";

type BackToTopProps = { darkMode: boolean };

export default function BackToTop({ darkMode }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  // Show the button once the page has been scrolled down a bit.
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      className={`fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border text-lg shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      } ${
        darkMode
          ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
          : "border-black/15 bg-white/80 text-black hover:bg-white"
      }`}
    >
      ↑
    </button>
  );
}