"use client";

import { useLanguage } from "@/app/providers";

interface ReviewListProps {
  reviews: Array<{
    id: string;
    rating: number;
    commentAr?: string | null;
    commentEn?: string | null;
    guestName: string;
    createdAt: string;
  }>;
  averageRating: number;
  totalReviews: number;
}

export function ReviewList({ reviews, averageRating, totalReviews }: ReviewListProps) {
  const { locale } = useLanguage();

  if (totalReviews === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-[var(--color-accent)]">{averageRating.toFixed(1)}</span>
        <span className="text-yellow-500">{"★".repeat(Math.round(averageRating))}</span>
        <span className="text-sm text-[var(--color-text-muted)]">({totalReviews})</span>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-[var(--color-border)] p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--color-text)]">{review.guestName}</span>
              <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {locale === "ar" ? review.commentAr : review.commentEn}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
