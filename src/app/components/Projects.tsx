"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Reveal from "./Reveal";

type Project = {
  name: string;
  image: string;
  link: string;
  description: string;
};

const PROJECTS: Project[] = [
  {
    name: "Space",
    image: "/images/space.png",
    link: "https://fathir-tugas-frontend-8.netlify.app/",
    description:
      "Landing page bertema luar angkasa dengan desain modern, animasi halus, dan tampilan responsif di semua perangkat.",
  },
  {
    name: "Tic Tac Toe",
    image: "/images/tiktak.png",
    link: "https://tic-tac-toe-fathir-tugas.netlify.app/",
    description:
      "Game klasik Tic Tac Toe untuk dua pemain dengan tampilan bersih, interaktif, dan mudah dimainkan.",
  },
  {
    name: "Bakery",
    image: "/images/bakery.png",
    link: "https://tugas-frontend-11-12.netlify.app/",
    description:
      "Website toko roti dengan nuansa hangat, galeri produk menarik, dan tata letak yang menggugah selera.",
  },
  {
    name: "Kucing",
    image: "/images/kucing.png",
    link: "https://fathir-akbar-tugas-11-b.netlify.app/",
    description:
      "Website tentang kucing berisi informasi menarik dan galeri foto, dibangun dengan layout yang rapi dan responsive.",
  },
  {
    name: "Orins",
    image: "/images/orins.png",
    link: "https://orins-company-profile.vercel.app/",
    description:
      "Company profile Orins dengan desain profesional, elegan, dan responsif di semua perangkat.",
  },
];

type ProjectsProps = { darkMode: boolean };

export default function Projects({ darkMode }: ProjectsProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Distance the track has scrolled left (px), kept within [0, period).
  const distanceRef = useRef(0);
  const periodRef = useRef(0);
  const autoRef = useRef(true);
  // True while the detail modal is open: pauses the auto-scroll so the
  // clicked card stays put and the frame can shrink back to it on close.
  const modalOpenRef = useRef(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(0);
  const suppressClickRef = useRef(false);
  const dragRef = useRef<{ id: number; lastX: number } | null>(null);
  const reducedMotionRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [closing, setClosing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<number>(0);
  // Rect of the clicked card and its fullscreen target (viewport px).
  const originRectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const targetRectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    // Without motion, close instantly instead of replaying the animation.
    if (prefersReducedMotion()) {
      setSelected(null);
      return;
    }
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closingRef.current = false;
      setClosing(false);
      setSelected(null);
    }, 700);
  }, []);

  // Clear the close timer if the component unmounts mid-animation.
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  // Pause the auto-scroll while the modal is open (including the closing
  // animation), so the card stays where it was when it was clicked.
  useEffect(() => {
    modalOpenRef.current = Boolean(selected);
  }, [selected]);

  // Grow the frame from the card to fullscreen once the portal has mounted.
  useEffect(() => {
    if (!selected) return;
    setExpanded(false);
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setExpanded(true))
    );
    return () => cancelAnimationFrame(id);
  }, [selected]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // One full copy of the list (+ trailing gap) — the seamless loop period.
    const measure = () => {
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[PROJECTS.length] as HTMLElement | undefined;
      const period =
        first && second
          ? second.offsetLeft - first.offsetLeft
          : track.scrollWidth / 2;
      if (period > 0) periodRef.current = period;
    };
    measure();
    window.addEventListener("resize", measure);

    let raf = 0;
    let lastTime = 0;
    const tick = (time: number) => {
      const period = periodRef.current;
      if (
        autoRef.current &&
        !draggingRef.current &&
        !modalOpenRef.current &&
        !reducedMotionRef.current &&
        period > 0 &&
        lastTime
      ) {
        // Same pace as the old CSS animation: one loop per 28s.
        distanceRef.current += (period / 28000) * (time - lastTime);
        distanceRef.current %= period;
        track.style.transform = `translate3d(${-distanceRef.current}px, 0, 0)`;
      }
      lastTime = time;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Close the modal on Escape and lock page scroll while it's open.
  useEffect(() => {
    if (!selected) return;
    closingRef.current = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selected, handleClose]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    setIsDragging(true);
    dragRef.current = { id: e.pointerId, lastX: e.clientX };
    movedRef.current = 0;
    suppressClickRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.id) return;
    const delta = e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    movedRef.current += Math.abs(delta);

    const period = periodRef.current || 1;
    distanceRef.current = (distanceRef.current - delta) % period;
    if (distanceRef.current < 0) distanceRef.current += period;

    const track = trackRef.current;
    if (track) {
      track.style.transform = `translate3d(${-distanceRef.current}px, 0, 0)`;
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.id) return;
    dragRef.current = null;
    draggingRef.current = false;
    setIsDragging(false);
    if (movedRef.current > 5) suppressClickRef.current = true;

    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    // Keep it paused while the cursor still hovers over the carousel,
    // resume the auto-scroll once it leaves.
    const el = document.elementFromPoint(e.clientX, e.clientY);
    autoRef.current = !(el && wrapper.contains(el));
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      // Ignore the click that follows a drag.
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // The carousel captures the pointer while dragging, which makes the
    // click event land on the wrapper instead of the card. Find the card
    // under the cursor and open its detail popup.
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el?.closest?.("a[data-project]");
    if (card) {
      const project = PROJECTS[Number(card.getAttribute("data-project"))];
      if (project) {
        e.preventDefault();
        e.stopPropagation();
        // Remember where the card sits so the frame can grow from there.
        const rect = card.getBoundingClientRect();
        originRectRef.current = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
        targetRectRef.current = {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
        setSelected(project);
      }
    }
  };

  // Buka: frame penuh layar + iris (lingkaran) tumbuh dari tengah kartu.
  // Tutup: frame menyusut balik ke posisi kartu (top/left/width/height).
  const originRect = originRectRef.current;
  const targetRect = targetRectRef.current;
  const isClosingFrame = Boolean(selected && closing);
  const isOpen = Boolean(selected && expanded && !closing);

  let frameStyle: CSSProperties = {};
  if (selected) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (isClosingFrame) {
      frameStyle = {
        left: originRect.left,
        top: originRect.top,
        width: originRect.width,
        height: originRect.height,
        borderRadius: 12,
      };
    } else {
      const cx = originRect.left + originRect.width / 2;
      const cy = originRect.top + originRect.height / 2;
      const irisR = Math.sqrt(
        Math.max(cx, vw - cx) ** 2 + Math.max(cy, vh - cy) ** 2
      );
      frameStyle = {
        left: targetRect.left,
        top: targetRect.top,
        width: targetRect.width,
        height: targetRect.height,
        "--iris-x": `${cx}px`,
        "--iris-y": `${cy}px`,
        "--iris-r": `${irisR}px`,
      } as CSSProperties;
    }
  }

  return (
    <section
      id="project"
      className={`relative z-10 w-full px-6 py-20 ${darkMode ? "bg-black" : "bg-white"}`}
    >
      <Reveal>
        <div className="mx-auto max-w-6xl">
          <h2 className={`mb-2 text-center text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
            My Project
          </h2>
          <p className={`mb-10 text-center ${darkMode ? "text-white/60" : "text-black/60"}`}>
            Click to detail
          </p>
          <div
            ref={wrapperRef}
            className={`touch-pan-y select-none overflow-hidden ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onPointerEnter={() => {
              if (!draggingRef.current) autoRef.current = false;
            }}
            onPointerLeave={() => {
              if (!draggingRef.current) autoRef.current = true;
            }}
            onClickCapture={handleClickCapture}
            onDragStart={(e) => e.preventDefault()}
          >
            <div ref={trackRef} className="flex w-max gap-6">
              {[...PROJECTS, ...PROJECTS].map((project, index) => (
                <a
                  key={`${project.name}-${index}`}
                  href={project.link}
                  data-project={index % PROJECTS.length}
                  aria-label={`Lihat detail ${project.name}`}
                  className={`group relative block h-52 w-72 shrink-0 overflow-hidden rounded-xl border sm:h-64 sm:w-96 ${darkMode ? "border-white/10" : "border-black/10"}`}
                >
                  <Image
                    src={project.image}
                    alt={project.name}
                    fill
                    sizes="(min-width: 640px) 24rem, 18rem"
                    className="pointer-events-none object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-lg font-bold text-white">
                    {project.name}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="flex items-center gap-2 rounded-full border border-accent bg-accent/15 px-5 py-2 text-sm font-semibold text-accent-light backdrop-blur-sm">
                      Detail <span>↗</span>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {selected &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail ${selected.name}`}
            className="fixed inset-0 z-[60] overflow-hidden"
          >
            <button
              type="button"
              aria-label="Tutup detail"
              onClick={handleClose}
              className={`expand-backdrop absolute inset-0 z-0 cursor-default bg-black/80 ${
                closing ? "opacity-0" : "opacity-100"
              }`}
            />
            {/* Frame yang membesar dari kartu sampai penuh satu layar */}
            <div
              className={`expand-frame ${isClosingFrame ? "" : "expand-iris"} ${isOpen ? "open" : ""}`}
              style={frameStyle}
            >
              <div className="absolute inset-0">
                <Image
                  src={selected.image}
                  alt={`Tampilan ${selected.name}`}
                  fill
                  sizes="100vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
              {/* Label kecil ala kartu, terlihat selama frame membesar */}
              <span className="expand-label absolute bottom-4 left-4 text-lg font-bold text-white drop-shadow sm:bottom-5 sm:left-5">
                {selected.name}
              </span>
              {/* Konten detail muncul setelah frame membesar penuh */}
              <div className="expand-content absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Tutup"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/30 text-lg text-white/85 backdrop-blur-sm transition-colors hover:bg-white/15 sm:right-6 sm:top-6"
                >
                  ✕
                </button>
                <h3 className="text-3xl font-bold text-white sm:text-4xl">
                  {selected.name}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                  {selected.description}
                </p>
                <a
                  href={selected.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-light"
                >
                  Kunjungi website <span>↗</span>
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
