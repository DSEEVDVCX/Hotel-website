"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Check, ArrowRight, Bed, Users, CreditCard, Calendar } from "@phosphor-icons/react";

export default function BookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const { t, locale } = useLanguage();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then(setBooking)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-on-surface-muted">{t.search.noResults}</p>
          <Link href="/bookings" className="btn btn-secondary mt-4 inline-flex">{t.guestAccount.backToBookings}</Link>
        </div>
      </main>
    );
  }

  const hotelName = locale === "ar" ? booking.hotel?.nameAr : booking.hotel?.nameEn;
  const currency = locale === "ar" ? "ر.س" : "SAR";
  const canCancel = booking.status === "CONFIRMED" || booking.status === "CHECKED_IN";

  return (
      <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        {/* Confirmation header */}
        <div className="card mb-6 p-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${booking.status === "CANCELLED" ? "bg-error/10" : "bg-success/10"}`}>
              {booking.status === "CANCELLED" ? (
                <span className="text-error text-xl">✕</span>
              ) : (
                <Check size={24} className="text-success" weight="light" aria-hidden />
              )}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-on-surface">{t.booking.confirmation}</h1>
              <p className="text-sm text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                {t.booking.bookingId}: <span className="font-bold text-on-surface">{booking.id}</span>
              </p>
            </div>
            <span className="ms-auto rounded-full bg-primary-tint px-3 py-1 font-kufi text-sm font-semibold text-primary">
              {booking.status}
            </span>
          </div>
        </div>

        {/* Booking details */}
        <div className="card mb-6 p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-on-surface">{locale === "ar" ? "تفاصيل الإقامة" : "Stay Details"}</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <dt className="flex items-center gap-2 text-on-surface-muted"><Calendar size={15} weight="light" aria-hidden />{t.search.checkIn}</dt>
              <dd className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>
                {new Date(booking.checkIn).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <dt className="flex items-center gap-2 text-on-surface-muted"><Calendar size={15} weight="light" aria-hidden />{t.search.checkOut}</dt>
              <dd className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>
                {new Date(booking.checkOut).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <dt className="flex items-center gap-2 text-on-surface-muted"><Users size={15} weight="light" aria-hidden />{t.search.guests}</dt>
              <dd className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{booking.guestCount}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-on-surface-muted">{locale === "ar" ? "الفندق" : "Hotel"}</dt>
              <dd className="font-semibold text-on-surface">{hotelName}</dd>
            </div>
          </dl>
        </div>

        {/* Line items — room types and assigned rooms */}
        {booking.lineItems && booking.lineItems.length > 0 && (
          <div className="card mb-6 p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-on-surface">{t.booking.roomType}</h2>
            <div className="space-y-4">
              {booking.lineItems.map((item: any, i: number) => (
                <div key={item.id ?? i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-on-surface">
                        {locale === "ar" ? item.roomType?.nameAr : item.roomType?.nameEn}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-muted">
                        <Bed size={14} weight="light" aria-hidden />
                        {item.quantity} {locale === "ar" ? "غرفة" : "room(s)"}
                      </p>
                    </div>
                    <p className="font-bold text-gold-deep" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {item.lineTotal} {currency}
                    </p>
                  </div>
                  {item.reservations && item.reservations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.reservations.map((res: any) => (
                        <span key={res.id} className="rounded-full bg-surface-muted px-2.5 py-1 font-kufi text-xs text-on-surface-muted">
                          {locale === "ar" ? "غرفة" : "Room"} #{res.room?.roomNumber ?? "—"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment info */}
        {booking.payment && (
          <div className="card mb-6 p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
              <CreditCard size={20} weight="light" className="text-gold-deep" aria-hidden />
              {t.booking.payment}
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-muted">{locale === "ar" ? "المبلغ" : "Amount"}</dt>
                <dd className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{booking.payment.amount} {booking.payment.currency}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-muted">{locale === "ar" ? "الحالة" : "Status"}</dt>
                <dd className="font-semibold text-primary">{booking.payment.status}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Total */}
        <div className="card mb-6 p-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold text-on-surface">{t.booking.total}</span>
            <span className="font-display text-2xl font-bold text-primary-hover" style={{ fontVariantNumeric: "tabular-nums" }}>
              {booking.totalPrice} {currency}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/bookings" className="btn btn-secondary">
            <ArrowRight size={16} weight="bold" className="rtl:rotate-180" aria-hidden />
            {t.guestAccount.backToBookings}
          </Link>
          {canCancel && (
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm(t.booking.cancelConfirm)) return;
                await fetch(`/api/bookings/${booking.id}/cancel`, { method: "PATCH" });
                window.location.reload();
              }}
            >
              {t.booking.cancel}
            </Button>
          )}
        </div>
      </main>
  );
}
