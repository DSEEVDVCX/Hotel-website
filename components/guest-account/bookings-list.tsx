"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { ReviewSection } from "@/components/guest-account/review-section";
import { SuitcaseRolling } from "@phosphor-icons/react";

const statusColors: Record<string, string> = {
  CONFIRMED: "text-success",
  CANCELLED: "text-error",
  CHECKED_IN: "text-primary",
  COMPLETED: "text-on-surface-subtle",
  PENDING: "text-gold-deep",
  FAILED: "text-error",
};

export default function BookingsList() {
  const { locale, t } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t.booking.cancelConfirm)) return;
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "PATCH" });
    if (res.ok) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
      );
    }
  };

  if (loading) return <p className="text-on-surface-muted">...</p>;

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-muted p-12 text-center">
        <SuitcaseRolling size={32} className="mx-auto mb-3 text-on-surface-subtle" weight="light" aria-hidden />
        <p className="text-on-surface-muted">{t.guestAccount.noBookings}</p>
        <Link href="/search" className="btn btn-primary mt-4 inline-flex">
          {locale === "ar" ? "تصفّح الغرف" : "Browse Rooms"}
        </Link>
      </div>
    );
  }

  const currency = locale === "ar" ? "ر.س" : "SAR";

  return (
    <div className="flex flex-col gap-4">
      {bookings.map((booking) => {
        const hotelName = locale === "ar" ? booking.hotel?.nameAr : booking.hotel?.nameEn;
        const canReview = booking.status === "CHECKED_OUT" || booking.status === "COMPLETED";
        return (
          <div key={booking.id} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-on-surface">{hotelName}</h3>
                <p className="mt-1 text-sm text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {new Date(booking.checkIn).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")} →{" "}
                  {new Date(booking.checkOut).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                </p>
                <p className="mt-1 text-sm text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {t.booking.total}: {booking.totalPrice} {currency}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`font-kufi text-sm font-semibold ${statusColors[booking.status] || "text-on-surface-muted"}`}>
                  {booking.status}
                </span>
                <Link href={`/booking/${booking.id}`} className="link-underline text-sm font-semibold text-primary-hover">
                  {t.guestAccount.bookingDetails}
                </Link>
                {(booking.status === "CONFIRMED" || booking.status === "CHECKED_IN") && (
                  <Button variant="outline" size="sm" onClick={() => handleCancel(booking.id)}>
                    {t.booking.cancel}
                  </Button>
                )}
              </div>
            </div>
            {canReview && (
              <div className="mt-4 border-t border-border pt-4">
                <ReviewSection hotelId={booking.hotelId} hotelName={hotelName} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
