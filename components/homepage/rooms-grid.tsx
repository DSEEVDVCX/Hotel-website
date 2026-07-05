"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { Star, Users, Bed, ArrowRight } from "@phosphor-icons/react";
import { useLanguage } from "@/app/providers";
import type { RoomTypeSummary } from "@/lib/room-types";
import { useRef } from "react";

export default function RoomsGrid({
  rooms,
  viewAllHref,
}: {
  rooms: RoomTypeSummary[];
  /** When set, a "view all" CTA is shown below the grid linking here. */
  viewAllHref?: string;
}) {
  const { t, locale } = useLanguage();
  const currency = locale === "ar" ? "ر.س" : "SAR";
  const guestsLabel = locale === "ar" ? "ضيوف" : "guests";
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const headingY = useTransform(scrollYProgress, [0, 0.3], [40, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section id="rooms" ref={sectionRef} className="scroll-mt-24 pattern-bg section-pad">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        {/* Heading — centered, cinematic */}
        <motion.div style={{ y: headingY, opacity: headingOpacity }} className="mb-14 text-center">
          <span className="eyebrow">{locale === "ar" ? "الإقامات الفاخرة" : "Luxury Stays"}</span>
          <h2 className="display-sm mt-5 font-display text-primary">{locale === "ar" ? "الغرف والأجنحة" : "Rooms & Suites"}</h2>
          <div className="ornament mt-5"><span className="ornament-diamond" /></div>
          <p className="mx-auto mt-4 max-w-xl text-on-surface-muted">
            {locale === "ar" ? "اختر غرفتك المثالية، شاهد التفاصيل، ثم احجز بإقامتك في الخطوة التالية." : "Choose your perfect room, view the details, then book your stay in the next step."}
          </p>
        </motion.div>

        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-muted p-12 text-center">
            <p className="text-on-surface-muted">{t.hotelHome.noFeatured}</p>
          </div>
        ) : (
          /* Gapless bento — grid-flow-dense prevents voids */
          <div className="grid grid-flow-dense grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[380px]">
            {rooms.map((room, i) => {
              const isLarge = i === 0;
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.2, 0, 0, 1] }}
                  className={isLarge ? "lg:col-span-2 lg:row-span-2" : ""}
                >
                  <Link href={`/rooms/${room.id}`} className="card group flex h-full flex-col" aria-label={locale === "ar" ? room.nameAr : room.nameEn}>
                    {/* Image — overflow-hidden for scale effect */}
                    <div className={`relative overflow-hidden ${isLarge ? "flex-1 min-h-[280px]" : "aspect-[4/3]"}`}>
                      <Image
                        src={room.photos?.[0] || `https://picsum.photos/seed/sewar-room-${room.id.slice(-4)}/700/525`}
                        alt={locale === "ar" ? room.nameAr : room.nameEn}
                        fill
                        unoptimized
                        sizes={isLarge ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                        className="object-cover img-elegant transition-transform duration-700 group-hover:scale-105"
                        style={{ transitionTimingFunction: "var(--ease-standard)" }}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gold-deep via-gold to-gold-deep" />
                      <div className="absolute start-3 top-3 flex items-center gap-0.5 rounded-full bg-surface-dark/70 px-2.5 py-1 backdrop-blur-sm">
                        {Array.from({ length: room.starRating }).map((_, j) => <Star key={j} size={11} weight="fill" className="text-gold-bright" aria-hidden />)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className={`font-display font-bold text-primary ${isLarge ? "text-2xl" : "text-lg"}`}>{locale === "ar" ? room.nameAr : room.nameEn}</h3>
                      <p className="mt-1 font-kufi text-sm text-on-surface-muted">{locale === "ar" ? room.hotelNameAr : room.hotelNameEn} · {room.city}</p>

                      {isLarge && room.descriptionAr && (
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-on-surface-muted">{locale === "ar" ? room.descriptionAr : room.descriptionEn}</p>
                      )}

                      {/* Specs — no meta-labels */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-kufi text-xs text-on-surface-muted">
                        <span className="inline-flex items-center gap-1"><Users size={13} weight="light" aria-hidden />{room.capacity} {guestsLabel}</span>
                        <span className="inline-flex items-center gap-1"><Bed size={13} weight="light" aria-hidden />{room.bedType}</span>
                      </div>

                      {/* Price + CTA */}
                      <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                        <div>
                          <span className="font-kufi text-xs text-on-surface-subtle">{t.hotelHome.startingFrom}</span>
                          <p className="font-display text-xl font-bold text-gold-deep" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {room.basePrice.toLocaleString()} {currency}
                            <span className="text-xs font-normal text-on-surface-muted"> / {t.hotelHome.perNight}</span>
                          </p>
                        </div>
                        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary-tint px-3 font-kufi text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-on-dark">
                          {t.hotelHome.viewDetails}
                          <ArrowRight size={13} weight="bold" className="rtl:rotate-180" aria-hidden />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {viewAllHref && rooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="mt-14 text-center"
          >
            <Link href={viewAllHref} className="btn btn-secondary">
              {t.hotelHome.exploreMore}
              <ArrowRight size={15} weight="bold" className="rtl:rotate-180" aria-hidden />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
