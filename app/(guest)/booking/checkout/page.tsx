"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { useLanguage } from "@/app/providers";
import { motion, useReducedMotion } from "motion/react";
import { Calendar, Users, ArrowRight, Check, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function StripePaymentFields({ onReady }: { onReady: (stripe: Stripe | null, elements: StripeElements | null) => void }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    onReady(stripe, elements);
  }, [stripe, elements, onReady]);

  return <PaymentElement />;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const reduce = useReducedMotion();

  const roomTypeId = searchParams.get("roomTypeId") || "";
  const hotelId = searchParams.get("hotelId") || "";

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "1");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [paymentClientSecret, setPaymentClientSecret] = useState("");
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [stripeElements, setStripeElements] = useState<StripeElements | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRoom(null);
    if (!roomTypeId) {
      setLoading(false);
      return;
    }
    fetch(`/api/room-types/${roomTypeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setRoom(data);
      })
      .catch(() => {
        if (!cancelled) setRoom(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomTypeId]);

  useEffect(() => {
    setPaymentIntentId("");
    setPaymentClientSecret("");
    setStripe(null);
    setStripeElements(null);
  }, [hotelId, roomTypeId, checkIn, checkOut, guests]);

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Number.isFinite(diff) && diff > 0 ? diff : 0;
  })();

  const basePrice = room ? (typeof room.basePrice === "number" ? room.basePrice : 0) : 0;
  const totalPrice = basePrice * nights;
  const currency = locale === "ar" ? "ر.س" : "SAR";
  const roomName = room ? (locale === "ar" ? room.nameAr : room.nameEn) : "";
  const hotelName = room ? (locale === "ar" ? room.hotelNameAr : room.hotelNameEn) : "";

  const preparePaymentIntent = async () => {
    if (!stripePromise) {
      throw new Error(locale === "ar" ? "مفتاح Stripe العام غير مضبوط" : "Stripe publishable key is not configured");
    }

    const intentRes = await fetch("/api/payments/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId,
        checkIn,
        checkOut,
        guestCount: parseInt(guests),
        lineItems: [{ roomTypeId, quantity: 1 }],
      }),
    });
    const intentData = await intentRes.json();
    if (!intentRes.ok) {
      throw new Error(intentData.error || (locale === "ar" ? "فشل تجهيز الدفع" : "Payment setup failed"));
    }

    setPaymentIntentId(intentData.paymentIntentId);
    setPaymentClientSecret(intentData.clientSecret || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!paymentClientSecret) {
        await preparePaymentIntent();
        setSubmitting(false);
        return;
      }

      if (!stripe || !stripeElements) {
        setError(locale === "ar" ? "بوابة الدفع لم تجهز بعد" : "Payment form is not ready yet");
        setSubmitting(false);
        return;
      }

      const paymentResult = await stripe.confirmPayment({
        elements: stripeElements,
        redirect: "if_required",
        confirmParams: { return_url: window.location.href },
      });

      if (paymentResult.error) {
        setError(paymentResult.error.message || (locale === "ar" ? "فشل تأكيد الدفع" : "Payment confirmation failed"));
        setSubmitting(false);
        return;
      }

      const confirmedIntentId = paymentResult.paymentIntent?.id || paymentIntentId;
      const status = paymentResult.paymentIntent?.status;
      if (!confirmedIntentId || (status !== "requires_capture" && status !== "succeeded")) {
        setError(locale === "ar" ? "لم يتم تأكيد الدفع" : "Payment was not confirmed");
        setSubmitting(false);
        return;
      }

      const idempotencyKey = crypto.randomUUID();
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          checkIn,
          checkOut,
          guestCount: parseInt(guests),
          idempotencyKey,
          lineItems: [{ roomTypeId, quantity: 1 }],
          guestDetails: { name, email, phoneNumber: phone },
          paymentIntentId: confirmedIntentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (confirmedIntentId) {
          await fetch(`/api/payments/intents/${confirmedIntentId}/cancel`, { method: "POST" }).catch(() => null);
        }
        setError(data.error || (locale === "ar" ? "فشل الحجز" : "Booking failed"));
        setSubmitting(false);
        return;
      }
      setConfirmation(data);
    } catch {
      setError(locale === "ar" ? "خطأ في الشبكة" : "Network error");
    }
    setSubmitting(false);
  };

  if (confirmation) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-lg items-center px-5 py-12">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="w-full rounded-2xl border border-border bg-surface-raised p-8 text-center shadow-md"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Check size={32} className="text-success" weight="light" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">{t.booking.confirmation}</h1>
          <p className="mt-3 text-sm text-on-surface-muted">
            {t.booking.bookingId}: <span className="font-bold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{confirmation.id}</span>
          </p>
          <Link href="/bookings" className="btn btn-primary mt-6">
            {t.booking.myBookings}
            <ArrowRight size={16} weight="bold" className="rtl:rotate-180" aria-hidden />
          </Link>
        </motion.div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-on-surface">{t.search.noResults}</p>
          <Link href="/" className="btn btn-secondary mt-4">
            <ArrowLeft size={16} weight="bold" className="rtl:rotate-180" aria-hidden />
            {locale === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </main>
    );
  }

  return (
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <h1 className="display-sm mb-2 font-display text-on-surface">{t.booking.title}</h1>
        <p className="mb-8 text-on-surface-muted">{roomName} · {hotelName}</p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
            {/* Dates */}
            <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
                <Calendar size={20} weight="light" className="text-primary-hover" aria-hidden />
                {locale === "ar" ? "تواريخ الإقامة" : "Stay Dates"}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ci" className="field-label">{t.search.checkIn}</label>
                  <input id="ci" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required min={new Date().toISOString().slice(0, 10)} className="field" />
                </div>
                <div>
                  <label htmlFor="co" className="field-label">{t.search.checkOut}</label>
                  <input id="co" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required min={checkIn || new Date().toISOString().slice(0, 10)} className="field" />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="gc" className="field-label">
                  <span className="inline-flex items-center gap-1"><Users size={14} weight="light" aria-hidden />{t.search.guests}</span>
                </label>
                <select id="gc" value={guests} onChange={(e) => setGuests(e.target.value)} className="field">
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Guest details */}
            <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
              <h2 className="mb-4 font-display text-lg font-bold text-on-surface">{t.booking.guestDetails}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="gn" className="field-label">{t.booking.fullName}</label>
                  <input id="gn" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="field" autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="ge" className="field-label">{t.booking.email}</label>
                  <input id="ge" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="field" autoComplete="email" />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="gp" className="field-label">{t.booking.phone}</label>
                <input id="gp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="field" autoComplete="tel" placeholder="+966 5x xxx xxxx" />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error" role="alert">
                {error}
              </div>
            )}

            {paymentClientSecret && (
              <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
                <h2 className="mb-4 font-display text-lg font-bold text-on-surface">{t.booking.payment}</h2>
                <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret, locale: locale === "ar" ? "ar" : "en" }}>
                  <StripePaymentFields onReady={(nextStripe, nextElements) => { setStripe(nextStripe); setStripeElements(nextElements); }} />
                </Elements>
              </div>
            )}

            <button type="submit" disabled={submitting || nights === 0 || (Boolean(paymentClientSecret) && (!stripe || !stripeElements))} className="btn btn-primary w-full">
              {submitting
                ? (locale === "ar" ? "جاري التأكيد..." : "Confirming...")
                : paymentClientSecret
                  ? t.booking.confirmBooking
                  : (locale === "ar" ? "المتابعة للدفع" : "Continue to payment")}
              <ArrowRight size={16} weight="bold" className="rtl:rotate-180" aria-hidden />
            </button>
          </form>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-surface-raised p-6 shadow-md">
              <h2 className="mb-4 font-display text-lg font-bold text-on-surface">{t.booking.orderSummary}</h2>

              <div className="mb-4 flex gap-3">
                <Image src={room.photos?.[0] || `https://picsum.photos/seed/sewar-checkout-${roomTypeId.slice(-4)}/200/150`} alt={roomName} width={112} height={80} unoptimized className="h-20 w-28 shrink-0 rounded-xl object-cover img-elegant" />
                <div>
                  <p className="font-display text-sm font-bold text-on-surface">{roomName}</p>
                  <p className="text-xs text-on-surface-muted">{hotelName}</p>
                  <p className="mt-1 text-xs text-on-surface-subtle">{room.bedType} · {room.capacity} {locale === "ar" ? "ضيوف" : "guests"}</p>
                </div>
              </div>

              <dl className="space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-on-surface-muted">{t.booking.roomType}</dt>
                  <dd className="font-medium text-on-surface">{roomName}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-on-surface-muted">{t.propertyDetail.perNight}</dt>
                  <dd className="font-medium text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{basePrice.toLocaleString()} {currency}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-on-surface-muted">{t.booking.nights}</dt>
                  <dd className="font-medium text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{nights || "—"}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <dt className="font-bold text-on-surface">{t.booking.total}</dt>
                  <dd className="font-display text-xl font-bold text-primary-hover" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {totalPrice.toLocaleString()} {currency}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface"><div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
