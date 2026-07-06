"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Star, MapPin, ArrowRight } from "@phosphor-icons/react";
import { useLanguage } from "@/app/providers";
import type { FeaturedProperty } from "@/lib/featured";
import FavoriteToggle from "@/components/guest-account/favorite-toggle";

export default function FeaturedCards({ properties }: { properties: FeaturedProperty[] }) {
  const { t, locale } = useLanguage();

  const fallbackImage = (hotelId: string, idx: number) =>
    `https://picsum.photos/seed/sewar-hotel-${idx}-${hotelId.slice(-4)}/800/600`;

  if (properties.length === 0) {
    return (
      <section id="featured" className="scroll-mt-24 section-pad text-center">
        <p className="text-lg text-on-surface-muted">{t.hotelHome.noFeatured}</p>
      </section>
    );
  }

  return (
    <section id="featured" className="scroll-mt-24 section-pad">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="mb-12 flex flex-wrap items-end justify-between gap-4"
        >
          <div className="max-w-xl">
            <span className="eyebrow">{t.markets.eyebrow}</span>
            <h2 className="display-sm mt-5 font-display text-on-surface">
              {t.hotelHome.featuredTitle}
            </h2>
            <p className="mt-3 text-on-surface-muted">{t.hotelHome.featuredSubtitle}</p>
          </div>
          <Link
            href="/search"
            className="link-underline inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-hover"
          >
            {t.hotelHome.exploreMore}
            <ArrowRight size={15} weight="bold" className="rtl:rotate-180" aria-hidden />
          </Link>
        </motion.div>

        {/* Grid: responsive, consistent spacing (Priority 5: spacing-scale 8dp) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop, i) => (
            <motion.div
              key={prop.hotelId}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.2, 0, 0, 1] }} // Priority 7: stagger 30-50ms
            >
              <Link
                href={`/hotels/${prop.hotelId}`}
                className="card group block h-full"
                aria-label={`${locale === "ar" ? prop.nameAr : prop.nameEn}, ${prop.city}`}
              >
                {/* Accessible image with alt (Priority 1: alt-text) */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={prop.heroImage || fallbackImage(prop.hotelId, i)}
                    alt={locale === "ar" ? prop.nameAr : prop.nameEn}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover img-elegant transition-transform duration-500 group-hover:scale-105"
                    style={{ transitionTimingFunction: "var(--ease-standard)" }}
                  />
                  {prop.isCurated && (
                    <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-semibold text-surface-raised shadow-sm">
                      {locale === "ar" ? "مميز" : "Featured"}
                    </span>
                  )}
                  <div className="absolute end-3 top-3">
                    <FavoriteToggle hotelId={prop.hotelId} />
                  </div>
                </div>

                <div className="p-5">
                  {/* Stars: icon + text (Priority 1: color-not-only) */}
                  <div className="mb-1.5 flex items-center gap-1 text-primary" aria-label={`${prop.starRating} ${locale === "ar" ? "نجوم" : "stars"}`}>
                    {Array.from({ length: prop.starRating }).map((_, j) => (
                      <Star key={j} size={13} weight="fill" aria-hidden />
                    ))}
                  </div>
                  <h3 className="font-display text-lg font-bold text-on-surface">
                    {locale === "ar" ? prop.nameAr : prop.nameEn}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-muted">
                    <MapPin size={13} weight="light" aria-hidden />
                    {prop.city}
                  </p>

                  {/* Price: tabular figures (Priority 6: number-tabular) */}
                  <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                    <div>
                      <span className="text-xs text-on-surface-subtle">{t.hotelHome.startingFrom}</span>
                      <p className="font-bold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {prop.startingPrice.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-on-surface-muted">
                          {locale === "ar" ? "ريال" : "SAR"} / {t.hotelHome.perNight}
                        </span>
                      </p>
                    </div>
                    {prop.avgRating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star size={14} weight="fill" className="text-primary" aria-hidden />
                        <span className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {prop.avgRating.toFixed(1)}
                        </span>
                        <span className="text-on-surface-subtle">({prop.reviewCount})</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
