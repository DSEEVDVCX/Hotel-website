"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/providers";
import { CreditCard, Receipt } from "@phosphor-icons/react";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "CAPTURED" | "FAILED" | "REFUNDED";
  capturedAt: string | null;
  refundedAt: string | null;
};

type BookingWithPayment = {
  id: string;
  checkIn: string;
  hotel: { nameAr: string; nameEn: string; city: string };
  payment: Payment | null;
};

const statusStyles: Record<Payment["status"], string> = {
  CAPTURED: "bg-success/10 text-success",
  PENDING: "bg-gold-deep/10 text-gold-deep",
  FAILED: "bg-error/10 text-error",
  REFUNDED: "bg-primary-tint text-primary",
};

export default function PaymentsList() {
  const { t, locale } = useLanguage();
  const [bookings, setBookings] = useState<BookingWithPayment[]>([]);
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

  if (loading) return <p className="text-on-surface-muted">...</p>;

  const withPayments = bookings.filter((b) => b.payment);

  if (withPayments.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-muted p-8 text-center">
        <Receipt size={32} className="mx-auto mb-3 text-on-surface-subtle" weight="light" aria-hidden />
        <p className="text-on-surface-muted">{t.guestAccount.noPayments}</p>
      </div>
    );
  }

  const currency = locale === "ar" ? "ر.س" : "SAR";

  const statusLabel = (s: Payment["status"]) => {
    switch (s) {
      case "CAPTURED":
        return t.guestAccount.paid;
      case "PENDING":
        return t.guestAccount.pendingPayment;
      case "REFUNDED":
        return t.guestAccount.refunded;
      default:
        return t.guestAccount.failed;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-start text-sm">
        <thead className="bg-surface-muted text-on-surface-muted">
          <tr>
            <th className="px-4 py-3 text-start font-medium">{t.guestAccount.paymentDate}</th>
            <th className="px-4 py-3 text-start font-medium">{t.guestAccount.myBookings}</th>
            <th className="px-4 py-3 text-start font-medium">{t.guestAccount.amount}</th>
            <th className="px-4 py-3 text-start font-medium">{t.guestAccount.paymentStatus}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {withPayments.map((b) => {
            const payment = b.payment!;
            const date = payment.capturedAt || payment.refundedAt || b.checkIn;
            return (
              <tr key={b.id} className="bg-surface">
                <td className="px-4 py-3 text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/booking/${b.id}`} className="font-medium text-on-surface hover:text-gold-deep">
                    {locale === "ar" ? b.hotel.nameAr : b.hotel.nameEn}
                  </Link>
                  <p className="text-xs text-on-surface-muted">{b.hotel.city}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <span className="inline-flex items-center gap-1.5">
                    <CreditCard size={14} weight="light" className="text-gold-deep" aria-hidden />
                    {payment.amount} {payment.currency || currency}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[payment.status]}`}>
                    {statusLabel(payment.status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
