"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Alur opening:
// 1. Fase "loading": loading screen lama — video kecil di pojok kanan bawah,
//    label "Loading..." di kiri vid, garis progres preload di dasar layar.
// 2. Loading web beres -> Fase "intro": opening-web.mp4 full-screen (diputar 1x).
// 3. Vid intro habis -> Fase "enter": klick-enter.mp4 full-screen loop,
//    klik/tap di mana pun untuk masuk (tulisan "klik to enter" udah ada
//    di dalam videonya, jadi gak perlu teks tambahan).
const CORNER_VIDEO = "/video/loading.mp4"; // video kecil pojok saat loading
const INTRO_VIDEO = "/video/opening-web.mp4"; // intro full-screen setelah loading
const ENTER_VIDEO = "/video/klick-enter.mp4"; // loop + klik untuk masuk

// 3 video opening: PRIORITAS utama saat loading — dibuffer duluan biar pas
// diputar full-screen gak kejedot buffering. Urutannya = urutan diputar.
const VIDEO_PRELOADS = [
  "/video/loading.mp4", // intro full-screen
  "/video/opening-web.mp4", // intro full-screen
  "/video/klick-enter.mp4", // loop + klik untuk masuk
];

// Gambar2 yang dipakai hero/about/project/navbar/social + logo: diunduh di
// background selama loading, jadi begitu masuk kebanyakan udah ke-cache.
const PRELOAD_ASSETS = [
  "/images/hero-bg.jpg",
  "/images/about-me-FTRMAN.png",
  "/images/FTR.png",
  "/images/FTR-WHITEMODE.png",
  "/images/FTRMAN-LOGO.png",
  "/images/instagram.jpeg",
  "/images/Github.jpeg",
  "/images/email.jpeg",
  "/images/logo-kodein-flat.png",
  "/images/skills/canva.svg",
];

// Catatan: gambar2 project (space/tiktak/bakery/kucing/orins) gak di-preload
// lagi — section My Project udah dihapus dr halaman utama (pindah ke dalem
// mini game sebagai popup list, jadi gambarnya gak kepake).

// Jaring pengaman: kalau ada video lambat/gagal, tetap lanjut (sisanya
// selesai dibuffer di background, gak menggantung preloader)
const ASSET_TIMEOUT_MS = 12000;

// Loading tampil minimal selama ini biar corner-nya sempat terlihat
const MIN_LOAD_MS = 1800;

// Jeda setelah semua siap sebelum mulai video intro
const HOLD_MS = 400;

// Durasi fade-out preloader saat masuk (harus sinkron dgn CSS 0.55s)
const LEAVE_MS = 550;

// Lama harus menahan kotak skip sebelum skip jalan (sinkron dgn --hold-ms di CSS)
const HOLD_SKIP_MS = 900;

// Kotak "press and hold again to skip" hilang sendiri kalau gak di-hold selama ini
const SKIP_VISIBLE_MS = 3200;

type Phase =
  | "loading" // loading screen lama: corner video + label + garis progres
  | "intro" // opening-web.mp4 full-screen, diputar sekali
  | "enter"; // klick-enter.mp4 full-screen loop + klik untuk masuk

export default function Preloader() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("loading");
  const [leaving, setLeaving] = useState(false);
  const [videosReady, setVideosReady] = useState(false); // 3 video opening beres dibuffer
  const [videosDone, setVideosDone] = useState(0); // video yang sudah beres dibuffer
  const [skipRevealed, setSkipRevealed] = useState(false); // kotak skip terlihat
  const [skipHiding, setSkipHiding] = useState(false); // kotak sedang fade-out (auto-hide)
  const [holding, setHolding] = useState(false); // sedang menahan kotak skip

  const startedAtRef = useRef(0);
  const skippedAtRef = useRef(0); // waktu skip terakhir (anti klik tembus)
  const holdReleasedAtRef = useRef(0); // waktu lepas hold terakhir (anti klik tembus)
  const holdingRef = useRef(false); // status sedang menahan kotak skip
  const holdTimerRef = useRef<number | null>(null); // timer hold -> skip

  // Skip: langsung lompat ke gate masuk (video klick-enter + klik).
  const handleSkipIntro = useCallback(() => {
    skippedAtRef.current = Date.now(); // klik sisa gesture tahan gak boleh masuk
    holdingRef.current = false;
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHolding(false);
    setSkipRevealed(false);
    setSkipHiding(false);
    setPhase("enter");
  }, []);

  // Hold-to-skip: kotak harus DITAHAN selama HOLD_SKIP_MS, bukan sekadar klik.
  const startHold = useCallback(() => {
    if (holdingRef.current || leaving) return;
    holdingRef.current = true;
    setHolding(true);
    holdTimerRef.current = window.setTimeout(() => {
      holdingRef.current = false;
      holdTimerRef.current = null;
      setHolding(false);
      handleSkipIntro();
    }, HOLD_SKIP_MS);
  }, [leaving, handleSkipIntro]);

  // Lepas/geser sebelum waktunya: batal, ring balik ke kosong. Waktu lepas
  // selalu dicatat buat meng-ignore click sisa gesture (anti klik tembus).
  const cancelHold = useCallback(() => {
    holdReleasedAtRef.current = Date.now();
    if (!holdingRef.current) return;
    holdingRef.current = false;
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHolding(false);
  }, []);

  /* ===== Preload saat loading =====
     PRIORITAS 1: 3 video opening dibuffer duluan (ditunggu sampai
     canplaythrough) — progresnya jadi bahan loading strip bawah, dan
     video2 inilah yang ditunggu sebelum lanjut ke intro.
     PRIORITAS 2: gambar2 + font halaman diunduh di background tanpa
     ditunggu — begitu masuk situs, kebanyakan udah ke-cache. */
  useEffect(() => {
    startedAtRef.current = Date.now();
    let cancelled = false;
    let done = 0;
    let finished = false;

    const finishVideos = () => {
      if (finished || cancelled) return;
      finished = true;
      setVideosReady(true);
    };

    const tickVideo = () => {
      if (cancelled || finished) return;
      done += 1;
      setVideosDone(done);
      if (done >= VIDEO_PRELOADS.length) finishVideos();
    };

    // Buffer video paling awal (urutan = urutan pemutaran). <video> detached
    // dengan preload=auto mengisi media cache yang sama dgn player aslinya.
    const cleanups = VIDEO_PRELOADS.map((src) => {
      const vid = document.createElement("video");
      vid.preload = "auto";
      vid.muted = true;
      let timer: number | null = null;
      const onDone = () => {
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
        vid.removeEventListener("canplaythrough", onDone);
        vid.removeEventListener("error", onDone);
        tickVideo(); // video gagal load juga dihitung, jangan nyangkutin
      };
      // Jaring pengaman per video: buffer yang kelamaan gak boleh nahan loading
      timer = window.setTimeout(onDone, ASSET_TIMEOUT_MS);
      vid.addEventListener("canplaythrough", onDone, { once: true });
      vid.addEventListener("error", onDone, { once: true });
      vid.src = src;
      vid.load();
      return () => {
        if (timer !== null) window.clearTimeout(timer);
        vid.removeEventListener("canplaythrough", onDone);
        vid.removeEventListener("error", onDone);
      };
    });

    // Gambar + font: background doang, gak nahan transisi loading -> intro
    PRELOAD_ASSETS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.catch(() => {});
    }

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  // Loading -> intro: tunggu 3 video opening BERES dibuffer DAN durasi
  // minimal biar loading screen-nya keburu terlihat, lalu mulai video
  // intro full-screen. Gambar/font gak nahan transisi ini.
  useEffect(() => {
    if (phase !== "loading" || !videosReady) return undefined;
    const remain = Math.max(
      0,
      MIN_LOAD_MS - (Date.now() - startedAtRef.current)
    );
    const t = window.setTimeout(() => setPhase("intro"), remain + HOLD_MS);
    return () => window.clearTimeout(t);
  }, [phase, videosReady]);

  // Press PERTAMA di mana pun (klik/keyboard) memunculkan kotak skip.
  // Hanya di fase loading/intro — di fase enter klik memang untuk masuk.
  const revealSkip = useCallback(() => {
    setSkipRevealed(true);
    setSkipHiding(false);
  }, []);

  useEffect(() => {
    if (phase === "enter" || leaving || skipRevealed) return undefined;
    window.addEventListener("keydown", revealSkip);
    window.addEventListener("pointerdown", revealSkip);
    return () => {
      window.removeEventListener("keydown", revealSkip);
      window.removeEventListener("pointerdown", revealSkip);
    };
  }, [phase, leaving, skipRevealed, revealSkip]);

  // Press BERIKUTNYA di mana pun yang DITAHAN menjalankan skip; lepas
  // sebelum waktunya membatalkan. Efek ini baru terpasang setelah kotak
  // muncul, jadi press pertama gak ikut terhitung sebagai hold.
  useEffect(() => {
    if (phase === "enter" || leaving || !skipRevealed) return undefined;
    window.addEventListener("keydown", startHold);
    window.addEventListener("pointerdown", startHold);
    window.addEventListener("keyup", cancelHold);
    window.addEventListener("pointerup", cancelHold);
    window.addEventListener("pointercancel", cancelHold);
    return () => {
      window.removeEventListener("keydown", startHold);
      window.removeEventListener("pointerdown", startHold);
      window.removeEventListener("keyup", cancelHold);
      window.removeEventListener("pointerup", cancelHold);
      window.removeEventListener("pointercancel", cancelHold);
    };
  }, [phase, leaving, skipRevealed, startHold, cancelHold]);

  // Auto-hide kotak skip: kalau sudah muncul tapi user gak menahan,
  // setelah SKIP_VISIBLE_MS kotaknya fade-out lalu hilang. Mulai menahan
  // menghentikan timer ini; lepas memulainya lagi dari nol.
  useEffect(() => {
    if (!skipRevealed || holding || leaving) return undefined;
    let hideTimer: number | null = null;
    const fadeTimer = window.setTimeout(() => {
      setSkipHiding(true);
      hideTimer = window.setTimeout(() => {
        setSkipRevealed(false);
        setSkipHiding(false);
      }, 300); // sinkron dgn durasi animasi preloader-skip-hide di CSS
    }, SKIP_VISIBLE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [skipRevealed, holding, leaving]);

  // Kalau window kehilangan fokus di tengah menahan -> batalin hold.
  useEffect(() => {
    const onBlur = () => cancelHold();
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("blur", onBlur);
      cancelHold();
    };
  }, [cancelHold]);

  // Masuk ke situs: fade-out preloader lalu unmount. Tulisan "klik to enter"
  // sudah ada di dalam video, jadi gate-nya murni klik/tap di mana pun.
  const handleEnter = useCallback(() => {
    if (phase !== "enter" || leaving) return;
    // Klik sisa gesture tahan skip gak boleh langsung masuk.
    if (Date.now() - skippedAtRef.current < 500) return;
    // Click yang muncul tepat setelah lepas hold juga gak boleh dihitung.
    if (Date.now() - holdReleasedAtRef.current < 300) return;
    setLeaving(true);
    window.setTimeout(() => setVisible(false), LEAVE_MS);
  }, [phase, leaving]);

  // Klik di mana pun saat video klick-enter tampil = masuk.
  useEffect(() => {
    if (phase !== "enter" || leaving) return undefined;
    window.addEventListener("pointerdown", handleEnter);
    return () => window.removeEventListener("pointerdown", handleEnter);
  }, [phase, leaving, handleEnter]);

  if (!visible) return null;

  // Loading strip = progres buffering 3 video opening (yang ditunggu)
  const percent = videosReady
    ? 100
    : Math.min(100, Math.round((videosDone / VIDEO_PRELOADS.length) * 100));

  return (
    <div
      className={`preloader ${leaving ? "preloader-leaving" : ""}`}
      role="status"
      aria-label="Loading FTRMAN portfolio"
      onContextMenu={(e) => e.preventDefault()} // tekan-tahan di mana pun gak buka menu
    >
      {/* ===== Fase 1: loading screen ala game ===== */}
      {phase === "loading" && (
        <>
          <div className="preloader-loadwrap">
            <div className="preloader-loading">
              <span>Loading</span>
              <span className="preloader-dots">...</span>
            </div>
            <video
              className="preloader-corner-video"
              src={CORNER_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              // Jaring pengaman: kalau atribut loop diabaikan browser
              // (biasanya gara2 codec), putar ulang manual begitu selesai.
              onEnded={(e) => {
                e.currentTarget.currentTime = 0;
                e.currentTarget.play().catch(() => {});
              }}
            />
          </div>
          {/* Loading strip: mengikuti progres preload aset asli */}
          <div className="preloader-progress">
            <span style={{ width: `${percent}%` }} />
          </div>
        </>
      )}

      {/* ===== Fase 2: video intro full-screen (diputar sekali) ===== */}      {phase === "intro" && (
        <video
          key="intro-video"
          className="preloader-video-full"
          src={INTRO_VIDEO}
          autoPlay
          muted
          playsInline
          preload="auto"
          // Vid intro habis -> nyambung ke video klick-enter
          onEnded={() => setPhase("enter")}
          onError={() => setPhase("enter")}
        />
      )}

      {/* ===== Fase 3: klick-enter.mp4 full-screen, loop terus ===== */}
      {phase === "enter" && (
        <video
          key="enter-video"
          className="preloader-video-full"
          src={ENTER_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          // Jaring pengaman: kalau atribut loop diabaikan browser
          // (biasanya gara2 codec), putar ulang manual begitu selesai.
          onEnded={(e) => {
            e.currentTarget.currentTime = 0;
            e.currentTarget.play().catch(() => {});
          }}
        />
      )}

      {/* ===== Kotak hold-to-skip (fase loading & intro) ===== */}
      {skipRevealed && phase !== "enter" && !leaving && (
        /* Kotaknya cuma indikator: hold-nya diterima di mana pun di layar
           (listener global), jadi elemen ini gak perlu interaksi. */
        <div
          className={`preloader-skip ${holding ? "preloader-skip-holding" : ""} ${skipHiding ? "preloader-skip-hiding" : ""}`}
        >
          <span className="preloader-skip-label">
            press and hold again to skip
          </span>
          {/* Ring bulet di kanan teks: terisi penuh selagi layar ditahan */}
          <svg
            className="preloader-skip-ring"
            viewBox="0 0 22 22"
            aria-hidden="true"
          >
            <circle
              className="preloader-skip-ring-bg"
              cx="11"
              cy="11"
              r="8.5"
            />
            <circle
              className="preloader-skip-ring-fill"
              cx="11"
              cy="11"
              r="8.5"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
