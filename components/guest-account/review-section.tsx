"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Star } from "@phosphor-icons/react";

interface ReviewSectionProps {
  hotelId: string;
  hotelName: string;
}

export function ReviewSection({ hotelId, hotelName }: ReviewSectionProps) {
  const { locale } = useLanguage();
  const [existingReview, setExistingReview] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Reviews are one-per-hotel per guest; ask the API for our own review.
    fetch(`/api/reviews?hotelId=${hotelId}&mine=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.review) setExistingReview(data.review);
      })
      .catch(() => {});
  }, [hotelId]);

  if (existingReview && !showForm) {
    return (
      <div className="card p-5">
        <h3 className="mb-3 font-display font-bold text-on-surface">
          {locale === "ar" ? "تقييمك" : "Your Review"}
        </h3>
        <div className="mb-2 flex gap-0.5 text-gold">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={16} weight={i < existingReview.rating ? "fill" : "regular"} className={i < existingReview.rating ? "text-gold" : "text-on-surface-subtle"} aria-hidden />
          ))}
        </div>
        {(existingReview.commentAr || existingReview.commentEn) && (
          <p className="text-sm text-on-surface-muted">
            {locale === "ar"
              ? (existingReview.commentAr || existingReview.commentEn)
              : (existingReview.commentEn || existingReview.commentAr)}
          </p>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="card p-5 text-center">
        <p className="font-display font-bold text-success">{locale === "ar" ? "شكراً لتقييمك!" : "Thank you for your review!"}</p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)} className="btn btn-secondary w-full">
        <Star size={16} weight="fill" className="text-gold" aria-hidden />
        {locale === "ar" ? `قيّم إقامتك في ${hotelName}` : `Review your stay at ${hotelName}`}
      </button>
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
          commentAr: locale === "ar" ? comment : "",
          commentEn: locale === "en" ? comment : "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit review");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  };

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-display font-bold text-on-surface">{locale === "ar" ? "اكتب تقييمك" : "Write Your Review"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">{locale === "ar" ? "التقييم" : "Rating"}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="min-h-11 min-w-11 flex items-center justify-center rounded-lg transition-transform hover:scale-110"
                aria-label={`${star} stars`}
              >
                <Star
                  size={28}
                  weight={(hoverRating || rating) >= star ? "fill" : "regular"}
                  className={(hoverRating || rating) >= star ? "text-gold" : "text-on-surface-subtle"}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">{locale === "ar" ? "تعليقك" : "Your Comment"}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="field resize-none"
            placeholder={locale === "ar" ? "شاركنا تجربتك..." : "Share your experience..."}
          />
        </div>
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>{submitting ? "..." : (locale === "ar" ? "إرسال" : "Submit")}</Button>
          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
        </div>
      </form>
    </div>
  );
}
