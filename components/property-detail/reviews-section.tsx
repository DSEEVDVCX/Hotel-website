"use client";

import { useLanguage } from "@/app/providers";
import { motion, useReducedMotion } from "motion/react";
import { Star } from "@phosphor-icons/react";

interface ReviewItem {
  id?: string;
  rating: number;
  commentAr: string | null;
  commentEn: string | null;
  createdAt: string;
  guest?: { name: string } | null;
}

export function ReviewsSection({
  reviews,
  avgRating,
  reviewCount,
}: {
  reviews: ReviewItem[];
  avgRating: number | null;
  reviewCount: number;
}) {
  const { locale, t } = useLanguage();
  const reduce = useReducedMotion();

  if (reviewCount === 0 || avgRating == null) {
    return (
      <div data-testid="property-reviews">
        <p className="text-on-surface-muted">{t.propertyDetail.noReviews}</p>
      </div>
    );
  }

  const rounded = Math.round(avgRating);

  return (
    <div data-testid="property-reviews">
      {/* Summary */}
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        className="mb-6 flex items-center gap-5 rounded-2xl border border-border bg-surface-raised p-6 shadow-sm"
      >
        <div className="flex flex-col items-center">
          <span className="font-display text-5xl font-bold text-primary-hover" style={{ fontVariantNumeric: "tabular-nums" }}>{avgRating.toFixed(1)}</span>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} weight={i < rounded ? "fill" : "regular"} className={i < rounded ? "text-primary" : "text-on-surface-subtle"} aria-hidden />
            ))}
          </div>
        </div>
        <div className="h-12 w-px bg-border" />
        <p className="text-on-surface-muted">
          {locale === "ar" ? "بناءً على" : "Based on"} <span className="font-bold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{reviewCount}</span> {locale === "ar" ? "مراجعة" : "reviews"}
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((review, i) => {
          const comment = locale === "ar" ? review.commentAr : review.commentEn;
          return (
            <motion.div
              key={review.id ?? `review-${i}`}
              initial={reduce ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.2, 0, 0, 1] }}
              className="rounded-2xl border border-border bg-surface-raised p-6 shadow-sm"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={14} weight={s < review.rating ? "fill" : "regular"} className={s < review.rating ? "text-primary" : "text-on-surface-subtle"} aria-hidden />
                ))}
              </div>
              {comment && <p className="mt-3 text-sm leading-relaxed text-on-surface-muted">&ldquo;{comment}&rdquo;</p>}
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary-hover">
                  {(review.guest?.name ?? "?").charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">{review.guest?.name ?? (locale === "ar" ? "ضيف" : "Guest")}</p>
                  <p className="text-xs text-on-surface-subtle">
                    {new Date(review.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
