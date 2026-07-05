"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDown } from "@phosphor-icons/react";
import { useLanguage } from "@/app/providers";
import { useRef } from "react";
import GenerativeHeroBackground from "./generative-hero";

export default function HotelHero() {
  const { t, locale } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section id="top" ref={ref} className="relative min-h-[100dvh] overflow-hidden bg-surface-dark">
      {/* Generative algorithmic background — Andalusian particle field */}
      <GenerativeHeroBackground className="absolute inset-0 z-0 h-full w-full opacity-60" />

      {/* Deep layered overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-surface-dark/70 via-surface-dark/30 to-surface-dark/90" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-primary/15 via-transparent to-transparent" />

      {/* Ambient mesh glows */}
      <div className="ambient-glow ambient-emerald h-[500px] w-[500px] top-[10%] start-[5%]" />
      <div className="ambient-glow ambient-gold h-[400px] w-[400px] bottom-[15%] end-[10%]" />

      {/* Subtle geometric pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4b878' fill-rule='evenodd'%3E%3Cpath d='M30 0l15 15-15 15-15-15zM30 30l15 15-15 15-15-15z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px",
      }} aria-hidden />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col items-center justify-center px-5 text-center lg:px-8"
      >
        {/* Ornamental top divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.2, 0, 0, 1] }}
          className="mb-6 flex items-center gap-3"
        >
          <span className="h-px w-12 bg-gradient-to-l from-gold to-transparent" />
          <span className="ornament-diamond" />
          <span className="h-px w-12 bg-gradient-to-r from-gold to-transparent" />
        </motion.div>

        {/* Wide H1 — max-w-5xl guarantees 2-3 lines */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.2, 0, 0, 1] }}
          className="display max-w-5xl font-display text-on-dark"
        >
          {t.hero.title}
        </motion.h1>

        {/* Ornamental divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.2, 0, 0, 1] }}
          className="mt-6 flex items-center gap-3"
        >
          <span className="h-px w-16 bg-gradient-to-l from-gold to-transparent" />
          <span className="ornament-diamond" />
          <span className="h-px w-16 bg-gradient-to-r from-gold to-transparent" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: [0.2, 0, 0, 1] }}
          className="mt-6 max-w-xl text-base leading-relaxed text-on-dark/75 md:text-lg"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* Single CTA — no spam tags */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: [0.2, 0, 0, 1] }}
          className="mt-8"
        >
          <button onClick={() => scrollTo("rooms")} className="btn btn-primary text-base">
            {locale === "ar" ? "تصفّح الغرف والأجنحة" : "Browse Rooms & Suites"}
            <ArrowDown size={16} weight="bold" aria-hidden />
          </button>
        </motion.div>
      </motion.div>

      <button
        onClick={() => scrollTo("rooms")}
        className="absolute bottom-5 end-5 z-10 hidden items-center gap-2 rounded-lg px-2 py-1 font-kufi text-[0.65rem] uppercase tracking-[0.2em] text-on-dark/50 transition-colors hover:text-gold-bright md:flex"
        aria-label={t.hero.scroll}
      >
        {t.hero.scroll}
        <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown size={13} aria-hidden />
        </motion.span>
      </button>
    </section>
  );
}
