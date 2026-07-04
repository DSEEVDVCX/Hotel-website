"use client";

import { useState } from "react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ReviewFormProps {
  bookingId: string;
  onSubmitted: () => void;
}

export function ReviewForm({ bookingId, onSubmitted }: ReviewFormProps) {
  const { locale, t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        rating,
        commentAr: locale === "ar" ? comment : undefined,
        commentEn: locale === "en" ? comment : undefined,
      }),
    });
    if (res.ok) onSubmitted();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--color-text)]">1–5</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}
              aria-label={`${star} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <Input
        label={locale === "ar" ? "تعليق" : "Comment"}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button type="submit" disabled={loading}>{loading ? "..." : t.admin.approve}</Button>
    </form>
  );
}
