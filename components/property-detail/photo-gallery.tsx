"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/providers";
import { motion, useReducedMotion } from "motion/react";
import { Camera, CaretLeft, CaretRight } from "@phosphor-icons/react";

interface GalleryImage {
  url: string;
  captionAr: string | null;
  captionEn: string | null;
  sortOrder: number;
}

export function PhotoGallery({ images }: { images: GalleryImage[] }) {
  const { locale } = useLanguage();
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sorted.length === 0) {
    return (
      <div data-testid="property-gallery" className="flex h-64 items-center justify-center rounded-2xl border border-border bg-surface-muted">
        <Camera size={40} className="text-on-surface-subtle" weight="light" aria-hidden />
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, sorted.length - 1);
  const active = sorted[safeIndex];
  const caption = locale === "ar" ? active.captionAr : active.captionEn;

  const goPrev = () => setActiveIndex((i) => (i - 1 + sorted.length) % sorted.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % sorted.length);

  return (
    <div data-testid="property-gallery">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-muted shadow-md">
        <motion.div
          key={safeIndex}
          initial={reduce ? {} : { opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="relative"
        >
          <div className="relative h-[360px] md:h-[500px]">
            <Image src={active.url} alt={caption ?? ""} fill unoptimized sizes="100vw" className="object-cover img-elegant" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/50 to-transparent" />
        </motion.div>

        {caption && (
          <motion.p
            key={`caption-${safeIndex}`}
            initial={reduce ? {} : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="absolute inset-x-0 bottom-0 p-5 text-base font-medium text-on-dark"
          >
            {caption}
          </motion.p>
        )}

        {sorted.length > 1 && (
          <>
            <button onClick={goPrev} aria-label="Previous" className="absolute start-3 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-dark/50 text-on-dark backdrop-blur-sm transition-colors hover:bg-surface-dark/70">
              <CaretLeft size={22} aria-hidden />
            </button>
            <button onClick={goNext} aria-label="Next" className="absolute end-3 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-dark/50 text-on-dark backdrop-blur-sm transition-colors hover:bg-surface-dark/70">
              <CaretRight size={22} aria-hidden />
            </button>
          </>
        )}

        <span className="absolute bottom-4 end-5 rounded-full bg-surface-dark/60 px-3 py-1 text-xs text-on-dark backdrop-blur-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
          {safeIndex + 1} / {sorted.length}
        </span>
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {sorted.map((img, i) => {
            const isActive = i === safeIndex;
            const thumbCaption = locale === "ar" ? img.captionAr : img.captionEn;
            return (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-current={isActive}
                aria-label={thumbCaption ?? `image ${i + 1}`}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${isActive ? "border-primary opacity-100" : "border-border opacity-60 hover:opacity-100"}`}
                style={{ transitionTimingFunction: "var(--ease-standard)" }}
              >
                <Image src={img.url} alt={thumbCaption ?? ""} fill unoptimized sizes="6rem" className="object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/95 backdrop-blur-sm" onClick={() => setFullscreen(false)} role="dialog" aria-modal="true">
          <div className="relative h-[90vh] w-[90vw]">
            <Image src={active.url} alt={caption ?? ""} fill unoptimized sizes="90vw" className="rounded-xl object-contain" />
          </div>
          <button onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Previous" className="absolute start-6 flex min-h-12 min-w-12 items-center justify-center rounded-full bg-on-dark/10 text-on-dark hover:bg-on-dark/20">
            <CaretLeft size={28} aria-hidden />
          </button>
          <button onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Next" className="absolute end-6 flex min-h-12 min-w-12 items-center justify-center rounded-full bg-on-dark/10 text-on-dark hover:bg-on-dark/20">
            <CaretRight size={28} aria-hidden />
          </button>
          <span className="absolute bottom-6 text-on-dark/80" style={{ fontVariantNumeric: "tabular-nums" }}>{safeIndex + 1} / {sorted.length}</span>
        </div>
      )}
    </div>
  );
}
