"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const hotelId = searchParams.get("hotelId") || "";
  const roomTypeId = searchParams.get("roomTypeId") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          checkIn,
          checkOut,
          guestCount: 2,
          idempotencyKey,
          lineItems: [{ roomTypeId, quantity: 1 }],
          guestDetails: { name, email, phoneNumber: phone },
          paymentMethodId: paymentMethodId || "stripe_test_pi",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Booking failed");
        setLoading(false);
        return;
      }

      setConfirmation(data);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  if (confirmation) {
    return (
      <main className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-xl border border-green-500 bg-green-50 p-6 text-center dark:bg-green-950">
          <h1 className="text-xl font-bold text-green-700 dark:text-green-400">{t.booking.confirmation}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {t.booking.bookingId}: {confirmation.id}
          </p>
          <Button className="mt-4" onClick={() => router.push("/bookings")}>
            {t.booking.myBookings}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">{t.booking.title}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.booking.guestDetails}</h2>
        <Input label={t.booking.fullName} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label={t.booking.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label={t.booking.phone} value={phone} onChange={(e) => setPhone(e.target.value)} required />

        <h2 className="mt-4 text-lg font-semibold text-[var(--color-text)]">{t.booking.payment}</h2>
        <Input
          label="Payment Method ID"
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
          placeholder="stripe_payment_intent_id"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "..." : t.booking.confirmBooking}
        </Button>
      </form>
    </main>
  );
}
