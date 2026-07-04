"use client";

import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";

interface BookingCardProps {
  booking: {
    id: string;
    status: string;
    checkIn: string;
    checkOut: string;
    totalPrice: { toNumber: () => number } | number;
    hotel?: { nameAr: string; nameEn: string; city: string };
  };
  onCancel?: (bookingId: string) => void;
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const { locale, t } = useLanguage();
  const hotelName = locale === "ar" ? booking.hotel?.nameAr : booking.hotel?.nameEn;
  const total = typeof booking.totalPrice === "number" ? booking.totalPrice : booking.totalPrice?.toNumber?.() ?? 0;
  const canCancel = booking.status === "CONFIRMED" || booking.status === "CHECKED_IN";

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--color-text)]">{hotelName}</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {new Date(booking.checkIn).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")} →{" "}
            {new Date(booking.checkOut).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">{t.booking.total}: {total} SAR</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-semibold">{booking.status}</span>
          {canCancel && onCancel && (
            <Button variant="outline" size="sm" onClick={() => onCancel(booking.id)}>
              {t.booking.cancel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
