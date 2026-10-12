import Image from "next/image";
import { useRef } from "react";
import Particles from "./Particles";
import Reveal from "./Reveal";

export default function Contact() {
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <section
      ref={sectionRef}
      id="closing"
      className="relative z-10 overflow-hidden px-6 py-24 text-center"
    >
      <div className="absolute inset-0 -z-20 bg-[#050505]" aria-hidden="true">
        <div className="absolute inset-x-0 -top-[15%] h-[130%]">
          <Particles
            particleCount={220}
            particleColors={["#ffffff", "#ffa52d", "#ffc46b"]}
            moveParticlesOnHover
            particleHoverFactor={0.6}
            alphaParticles
            particleBaseSize={110}
            particleSpread={13}
            listenOn={sectionRef}
          />
        </div>
      </div>
      <Reveal>
        <h2 className="mx-auto mb-4 max-w-2xl text-3xl font-bold text-white md:text-4xl">
          Bangun sesuatu yang luar biasa bersama kami!
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-white/70">
          Kami percaya bahwa setiap proyek adalah peluang untuk tumbuh bersama.
          Mari bekerja sama dan wujudkan ide Anda menjadi kenyataan!
        </p>
        <a
          href="mailto:fathir.akbar123321@gmail.com"
          className="mb-10 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-accent"
        >
          <Image
            src="/images/email.jpeg"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover"
          />
          Email Saya ↗
        </a>
      </Reveal>
    </section>
  );
}