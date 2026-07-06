"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { Star, Users, Bed, ArrowRight, Camera } from "@phosphor-icons/react";
import { useLanguage } from "@/app/providers";
import type { RoomTypeSummary } from "@/lib/room-types";
import { useMemo, useRef, useState } from "react";

export default function RoomsGrid({
  rooms,
  viewAllHref,
  showFilters = false,
}: {
  rooms: RoomTypeSummary[];
  /** When set, a "view all" CTA is shown below the grid linking here. */
  viewAllHref?: string;
  showFilters?: boolean;
}) {
  const { t, locale } = useLanguage();
  const currency = locale === "ar" ? "ر.س" : "SAR";
  const guestsLabel = locale === "ar" ? "ضيوف" : "guests";
  const [cityFilter, setCityFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const headingY = useTransform(scrollYProgress, [0, 0.3], [40, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const cities = useMemo(() => Array.from(new Set(rooms.map((room) => room.city).filter(Boolean))).sort(), [rooms]);
  const filteredRooms = useMemo(() => {
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    const minCapacity = capacity === "" ? null : Number(capacity);

    const filtered = rooms.filter((room) => {
      if (cityFilter && room.city !== cityFilter) return false;
      if (min !== null && room.basePrice > 0 && room.basePrice < min) return false;
      if (max !== null && room.basePrice > 0 && room.basePrice > max) return false;
      if (minCapacity !== null && room.capacity > 0 && room.capacity < minCapacity) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "priceLow") return (a.basePrice || Number.MAX_SAFE_INTEGER) - (b.basePrice || Number.MAX_SAFE_INTEGER);
      if (sortBy === "priceHigh") return b.basePrice - a.basePrice;
      return 0;
    });
  }, [rooms, cityFilter, minPrice, maxPrice, capacity, sortBy]);
  const visibleRooms = showFilters ? filteredRooms : rooms;

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

        {showFilters && rooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.2, 0, 0, 1] }}
            className="mb-10 rounded-[2rem] border border-gold/20 bg-surface-raised/90 p-2 shadow-sm"
          >
            <div className="rounded-[calc(2rem-0.5rem)] border border-border bg-surface p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-xl font-bold text-primary">{t.search.filters}</h3>
                <button
                  type="button"
                  onClick={() => { setCityFilter(""); setMinPrice(""); setMaxPrice(""); setCapacity(""); setSortBy("newest"); }}
                  className="link-underline text-sm font-semibold text-primary-hover"
                >
                  {t.search.clearFilters}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="field-label">{t.search.destination}</label>
                  <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="field">
                    <option value="">{t.search.allCities}</option>
                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">{t.search.minPrice}</label>
                  <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="field" type="number" min="0" inputMode="numeric" />
                </div>
                <div>
                  <label className="field-label">{t.search.maxPrice}</label>
                  <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="field" type="number" min="0" inputMode="numeric" />
                </div>
                <div>
                  <label className="field-label">{t.search.capacity}</label>
                  <input value={capacity} onChange={(e) => setCapacity(e.target.value)} className="field" type="number" min="1" inputMode="numeric" placeholder={t.search.anyCapacity} />
                </div>
                <div>
                  <label className="field-label">{t.search.sortBy}</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="field">
                    <option value="newest">{t.search.newest}</option>
                    <option value="priceLow">{t.search.priceLow}</option>
                    <option value="priceHigh">{t.search.priceHigh}</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {visibleRooms.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-muted p-12 text-center">
            <p className="text-on-surface-muted">{t.hotelHome.noFeatured}</p>
          </div>
        ) : (
          /* Gapless bento — grid-flow-dense prevents voids */
          <div className="grid grid-flow-dense grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[380px]">
            {visibleRooms.map((room, i) => {
              const isLarge = i === 0;
              const photo = room.photos?.[0] ?? null;
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.2, 0, 0, 1] }}
                  className={isLarge ? "lg:col-span-2 lg:row-span-2" : ""}
                >
                  <Link href={room.href ?? `/rooms/${room.id}`} className="card group flex h-full flex-col" aria-label={locale === "ar" ? room.nameAr : room.nameEn}>
                    {/* Image — overflow-hidden for scale effect */}
                    <div className={`relative overflow-hidden bg-surface-muted ${isLarge ? "flex-1 min-h-[280px]" : "aspect-[4/3]"}`}>
                      {photo ? (
                        <Image
                          src={photo}
                          alt={locale === "ar" ? room.nameAr : room.nameEn}
                          fill
                          unoptimized
                          sizes={isLarge ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                          className="object-cover img-elegant transition-transform duration-700 group-hover:scale-105"
                          style={{ transitionTimingFunction: "var(--ease-standard)" }}
                        />
                      ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center text-on-surface-subtle">
                          <Camera size={34} weight="light" aria-hidden />
                        </div>
                      )}
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

        {viewAllHref && visibleRooms.length > 0 && (
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
