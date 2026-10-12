"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

// Overlay fullscreen buat mini game Phaser. Phaser di-dynamic import
// begitu overlay dibuka pertama kali — gak nambah bundle halaman utama.
// Keluar: tombol "◄ EXIT" atau tekan ESC.
// Interaksi: deket bingkai foto + tekan E -> scene kirim event
// "ftrman:open-about" -> popup profil about (game di-pause selagi kebuka).

// Tipe minimal game Phaser (structural, biar gak perlu import runtime)
type GameHandle = {
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
  scene: {
    getScene: (
      key: string
    ) => { scene: { pause: () => void; resume: () => void } } | null;
  };
  events: {
    on: (event: string, cb: () => void) => void;
    off: (event: string, cb: () => void) => void;
  };
};

const SCENE_KEY = "FtrmanRoom";

const ABOUT_SOCIALS = [
  { image: "/images/instagram.jpeg", label: "Instagram", href: "https://www.instagram.com/ftr_ak4/" },
  { image: "/images/Github.jpeg", label: "GitHub", href: "https://github.com/Fathir-akbar" },
  { image: "/images/email.jpeg", label: "Email", href: "mailto:fathir.akbar123321@gmail.com" },
];

// Data asli dari section Skills & My Project (yg udah dihapus dr halaman
// utama — sekarang tinggal di dalem game: komputer = Skills, rak buku = Project).
const SKILL_ITEMS: { name: string; level: number }[] = [
  { name: "Figma", level: 95 },
  { name: "Canva", level: 90 },
  { name: "HTML", level: 85 },
  { name: "CSS", level: 80 },
  { name: "JavaScript", level: 30 },
  { name: "Tailwind CSS", level: 20 },
  { name: "Next.js", level: 20 },
  { name: "React", level: 20 },
];

const PROJECT_ITEMS: { name: string; link: string }[] = [
  { name: "Space", link: "https://fathir-tugas-frontend-8.netlify.app/" },
  { name: "Tic Tac Toe", link: "https://tic-tac-toe-fathir-tugas.netlify.app/" },
  { name: "Bakery", link: "https://tugas-frontend-11-12.netlify.app/" },
  { name: "Kucing", link: "https://fathir-akbar-tugas-11-b.netlify.app/" },
  { name: "Orins", link: "https://orins-company-profile.vercel.app/" },
];

type GameOverlayProps = { onClose: () => void };

export default function GameOverlay({ onClose }: GameOverlayProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [closing, setClosing] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const anyPopupOpen = aboutOpen || skillsOpen || projectsOpen;

  const close = useCallback(() => {
    setClosing(true);
    // Tunggu animasi fade-out 0.3s (sinkron dgn CSS) baru unmount
    window.setTimeout(onClose, 300);
  }, [onClose]);

  // ESC: nutup popup dulu kalau kebuka; kalau gak, keluar game
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (aboutOpen) {
        setAboutOpen(false);
      } else if (skillsOpen) {
        setSkillsOpen(false);
      } else if (projectsOpen) {
        setProjectsOpen(false);
      } else {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutOpen, skillsOpen, projectsOpen, close]);

  // Kunci scroll halaman belakang + bootstrap Phaser di dalam host div
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let cancelled = false;

    (async () => {
      const [{ createFtrmanRoomGame }] = await Promise.all([
        import("../game/FtrmanRoomScene"),
      ]);
      if (cancelled || !hostRef.current) return;
      const game = createFtrmanRoomGame(hostRef.current) as GameHandle;
      gameRef.current = game;
      // Scene minta popup dibuka (tekan E deket bingkai/komputer/rak)
      game.events.on("ftrman:open-about", () => setAboutOpen(true));
      game.events.on("ftrman:open-skills", () => setSkillsOpen(true));
      game.events.on("ftrman:open-projects", () => setProjectsOpen(true));
    })();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Popup kebuka -> pause scene; nutup -> resume lagi
  useEffect(() => {
    const scene = gameRef.current?.scene.getScene(SCENE_KEY);
    if (!scene) return;
    if (anyPopupOpen) {
      scene.scene.pause();
    } else {
      scene.scene.resume();
    }
  }, [anyPopupOpen]);

  return (
    <div
      className={`game-overlay ${closing ? "game-overlay-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="FTRMAN mini game"
    >
      {/* Host canvas Phaser (di-stretch penuh layar via CSS) */}
      <div ref={hostRef} className="game-overlay-host" />

      {/* Tombol keluar ala pixel game */}
      <button
        type="button"
        onClick={close}
        className="pixel-btn game-overlay-exit"
        aria-label="Keluar dari game"
      >
        ◄ EXIT
      </button>

      {/* Hint kontrol — desktop doang (keyboard) */}
      <div className="game-overlay-hint">WASD / PANAH buat jalan · ESC keluar</div>

      {/* ===== Popup profil about (tekan E deket bingkai foto) ===== */}
      {aboutOpen && (
        <div
          className="game-popup"
          role="dialog"
          aria-modal="true"
          aria-label="Profil Fathir Akbar"
          onClick={() => setAboutOpen(false)} // klik backdrop = tutup
        >
          <div
            className="game-popup-card"
            onClick={(e) => e.stopPropagation()} // klik dlm kartu gak nutup
          >
            <button
              type="button"
              className="game-popup-close"
              onClick={() => setAboutOpen(false)}
              aria-label="Tutup profil"
            >
              ✕
            </button>
            <div className="game-popup-photo">
              <Image
                src="/images/about-me-FTRMAN.png"
                alt="Fathir Akbar"
                width={96}
                height={120}
                className="h-full w-full object-contain"
              />
            </div>
            <h3 className="game-popup-name">Fathir Akbar</h3>
            <p className="game-popup-role">PELAJAR · WEB DEV · DESAIN</p>
            <p className="game-popup-bio">
              Hallo! Aku Fathir Akbar, seorang pelajar yang suka belajar dunia
              IT, terutama website, pemrograman, dan desain. Aku juga senang
              membantu orang lain dengan skill yang aku punya.
            </p>
            <div className="game-popup-socials">
              {ABOUT_SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("mailto") ? undefined : "_blank"}
                  rel={social.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                  aria-label={social.label}
                  className="game-popup-social"
                >
                  <Image
                    src={social.image}
                    alt={social.label}
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
            <p className="game-popup-key">[E] tutup · klik luar juga bisa</p>
          </div>
        </div>
      )}

      {/* ===== Popup Skills (tekan E deket komputer tembok) ===== */}
      {skillsOpen && (
        <div
          className="game-popup"
          role="dialog"
          aria-modal="true"
          aria-label="Skills"
          onClick={() => setSkillsOpen(false)}
        >
          <div
            className="game-popup-card game-popup-list"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="game-popup-close"
              onClick={() => setSkillsOpen(false)}
              aria-label="Tutup skills"
            >
              ✕
            </button>
            <h3 className="game-popup-name">SKILLS</h3>
            <p className="game-popup-role">TEKNOLOGI YANG AKU PAKAI</p>
            <ul className="skill-list">
              {SKILL_ITEMS.map((skill, index) => (
                <li key={skill.name} className="skill-row">
                  <div className="skill-row-top">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-level">{skill.level}%</span>
                  </div>
                  <div className="skill-bar">
                    <div
                      className="skill-bar-fill"
                      style={{
                        width: `${skill.level}%`,
                        animationDelay: `${index * 60}ms`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="game-popup-key">[E] tutup · klik luar juga bisa</p>
          </div>
        </div>
      )}

      {/* ===== Popup My Project (tekan E deket rak buku) ===== */}
      {projectsOpen && (
        <div
          className="game-popup"
          role="dialog"
          aria-modal="true"
          aria-label="My Project"
          onClick={() => setProjectsOpen(false)}
        >
          <div
            className="game-popup-card game-popup-list"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="game-popup-close"
              onClick={() => setProjectsOpen(false)}
              aria-label="Tutup project"
            >
              ✕
            </button>
            <h3 className="game-popup-name">MY PROJECT</h3>
            <p className="game-popup-role">KLIK UNTUK BUKA PROJECT-NYA</p>
            <ul className="project-list">
              {PROJECT_ITEMS.map((project) => (
                <li key={project.name}>
                  <a
                    className="project-row"
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="project-name">{project.name}</span>
                    <span className="project-arrow">►</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="game-popup-key">[E] tutup · klik luar juga bisa</p>
          </div>
        </div>
      )}
    </div>
  );
}
