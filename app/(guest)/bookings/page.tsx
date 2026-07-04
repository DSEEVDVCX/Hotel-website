"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";

const statusColors: Record<string, string> = {
  CONFIRMED: "text-green-600",
  CANCELLED: "text-red-500",
  CHECKED_IN: "text-blue-600",
  COMPLETED: "text-gray-500",
  PENDING: "text-yellow-600",
  FAILED: "text-red-700",
};

export default function MyBookingsPage() {
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

  if (loading) return <main className="px-4 py-8">...</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">{t.booking.myBookings}</h1>
      {bookings.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">{t.search.noResults}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => {
            const hotelName = locale === "ar" ? booking.hotel?.nameAr : booking.hotel?.nameEn;
            return (
              <div
                key={booking.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)]">{hotelName}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {new Date(booking.checkIn).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")} →{" "}
                      {new Date(booking.checkOut).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {t.booking.total}: {booking.totalPrice} SAR
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-sm font-semibold ${statusColors[booking.status] || ""}`}>
                      {booking.status}
                    </span>
                    {(booking.status === "CONFIRMED" || booking.status === "CHECKED_IN") && (
                      <Button variant="outline" size="sm" onClick={() => handleCancel(booking.id)}>
                        {t.booking.cancel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
