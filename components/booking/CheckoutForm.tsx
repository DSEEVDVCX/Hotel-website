"use client";

import { useState } from "react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CheckoutFormProps {
  onSubmit: (data: { name: string; email: string; phone: string; paymentMethodId: string }) => void;
  loading: boolean;
  error: string;
}

export function CheckoutForm({ onSubmit, loading, error }: CheckoutFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, email, phone, paymentMethodId });
      }}
      className="flex flex-col gap-4"
    >
      <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.booking.guestDetails}</h2>
      <Input label={t.booking.fullName} value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label={t.booking.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input label={t.booking.phone} value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <h2 className="mt-4 text-lg font-semibold text-[var(--color-text)]">{t.booking.payment}</h2>
      <Input label="Payment Method ID" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} placeholder="stripe_payment_intent_id" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "..." : t.booking.confirmBooking}
      </Button>
    </form>
  );
}
