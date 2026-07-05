"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Star } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

/**
 * Lets any logged-in user leave one rating + comment for a hotel.
 * Posts to /api/reviews with { hotelId, rating, comment } — no booking required.
 */
export function WriteReview({
  hotelId,
  onSubmitted,
}: {
  hotelId: string;
  onSubmitted?: () => void;
}) {
  const { locale } = useLanguage();
  const { status } = useSession();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const ar = locale === "ar";

  if (status !== "authenticated") {
    return (
      <div className="card p-5 text-center">
        <p className="text-on-surface-muted">
          {ar ? "سجّل الدخول لكتابة تقييم." : "Log in to write a review."}{" "}
          <Link href="/login" className="link-underline font-semibold text-primary-hover">
            {ar ? "تسجيل الدخول" : "Log in"}
          </Link>
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-5 text-center">
        <p className="font-display font-bold text-success">
          {ar ? "شكراً لتقييمك!" : "Thank you for your review!"}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          rating,
          commentAr: ar ? comment : undefined,
          commentEn: ar ? undefined : comment,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          res.status === 409
            ? ar
              ? "لقد قيّمت هذا الفندق من قبل."
              : "You have already reviewed this hotel."
            : data.error || (ar ? "تعذّر إرسال التقييم" : "Failed to submit review")
        );
        setSubmitting(false);
        return;
      }
      setDone(true);
      onSubmitted?.();
    } catch {
      setError(ar ? "خطأ في الشبكة" : "Network error");
    }
    setSubmitting(false);
  };

  return (
    <div className="card mb-6 p-5">
      <h3 className="mb-4 font-display font-bold text-on-surface">
        {ar ? "اكتب تقييمك" : "Write Your Review"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">{ar ? "التقييم" : "Rating"}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-transform hover:scale-110"
                aria-label={`${star} stars`}
              >
                <Star
                  size={28}
                  weight={(hover || rating) >= star ? "fill" : "regular"}
                  className={(hover || rating) >= star ? "text-gold" : "text-on-surface-subtle"}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">{ar ? "تعليقك" : "Your Comment"}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="field resize-none"
            placeholder={ar ? "شاركنا تجربتك..." : "Share your experience..."}
          />
        </div>
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "..." : ar ? "إرسال" : "Submit"}
        </Button>
      </form>
    </div>
  );
}
