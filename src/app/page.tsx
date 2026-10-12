"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import GameOverlay from "./components/GameOverlay";
import BackToTop from "./components/BackToTop";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Preloader from "./components/Preloader";
import Reveal from "./components/Reveal";
import WarpText from "./components/WarpText";

const SOCIALS = [
  {
    image: "/images/instagram.jpeg",
    label: "Instagram",
    href: "https://www.instagram.com/ftr_ak4/",
  },
  {
    image: "/images/Github.jpeg",
    label: "GitHub",
    href: "https://github.com/Fathir-akbar",
  },
  {
    image: "/images/email.jpeg",
    label: "Email",
    href: "mailto:fathir.akbar123321@gmail.com",
  },
  {
    image: "/images/logo-kodein-flat.png",
    label: "Kodein",
    href: "https://kodein.sch.id/",
  },
];

const subscribeToSystemTheme = (onChange: () => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const getServerTheme = () => true; // dark default while prerendering

export default function Home() {
  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerTheme
  );
  const [manualDark, setManualDark] = useState<boolean | null>(null);
  const [gameOpen, setGameOpen] = useState(false);
  const darkMode = manualDark ?? systemDark;

  return (
    <main
      className={`relative isolate min-h-screen transition-colors duration-500 ${darkMode ? "bg-black" : "bg-[#f4f5ef]"}`}
    >
      <Preloader />
      <Navbar
        darkMode={darkMode}
        onToggleTheme={() => setManualDark((current) => !(current ?? systemDark))}
      />
      <div className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 sm:flex">
        {SOCIALS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target={social.href.startsWith("mailto") ? undefined : "_blank"}
            rel={social.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
            aria-label={social.label}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-black/20 backdrop-blur-sm transition-transform hover:scale-110"
          >
            <Image
              src={social.image}
              alt={social.label}
              width={40}
              height={40}
              className={`h-full w-full ${social.label === "Kodein" ? "object-contain p-1" : "object-cover"}`}
            />
          </a>
        ))}
      </div>
      <section
        id="hero"
        className="isolate relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
      >
        <div className="fixed inset-0 z-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center bg-no-repeat" />
        <div className="absolute inset-0 z-10 bg-black/55" />
        <h1 className="sr-only">FTRMAN</h1>
        <WarpText
          text="FTRMAN"
          color="#ffffff"
          refraction={0}
          fontSize="clamp(4.5rem, 12vw, 8rem)"
          className="relative z-20"
        />
        {/* Tombol masuk mini game (pixel style) */}
        <button
          type="button"
          onClick={() => setGameOpen(true)}
          className="pixel-btn relative z-20 mt-8"
        >
          ▶ START
        </button>
      </section>
      <section
        id="about"
        className={`relative z-10 w-full overflow-hidden pt-14 md:pt-20 ${darkMode ? "bg-black text-white" : "bg-[#f4f5ef] text-black"}`}
      >
        <Reveal>
          <div className="grid items-stretch md:grid-cols-2">
            {/* Foto full-bleed; sisi kanannya dipotong miring (bawah kiri -> kanan atas) */}
            <div className="relative aspect-[4/5] w-full md:aspect-auto md:min-h-[90vh] md:[clip-path:polygon(0_0,100%_0,80%_100%,0_100%)] md:[-webkit-mask-image:linear-gradient(102deg,black_60%,transparent_78%)] md:[mask-image:linear-gradient(102deg,black_60%,transparent_78%)]">
              <Image
                src="/images/about-me-FTRMAN.png"
                alt="Fathir Akbar"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain object-left"
              />
            </div>
            <div className="flex flex-col justify-center px-6 py-16 text-center md:py-20 md:pl-10 md:text-left lg:pl-16">
              <h2 className="mb-6 text-3xl font-bold">Tentang Aku</h2>
              <p
                className={
                  darkMode
                    ? "leading-relaxed text-white/70"
                    : "leading-relaxed text-black/65"
                }
              >
                Hallo! Aku Fathir Akbar, seorang pelajar yang suka belajar dunia
                IT, terutama website, pemrograman, dan desain. Aku juga senang
                membantu orang lain dengan skill yang aku punya.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
      <Contact />
      <Footer />
      <BackToTop darkMode={darkMode} />
      {/* Mini game FTRMAN — overlay fullscreen, dibuka dr tombol START */}
      {gameOpen && <GameOverlay onClose={() => setGameOpen(false)} />}
    </main>
  );
}
