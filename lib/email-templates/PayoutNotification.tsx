import * as React from "react";

interface PayoutEmailProps {
  locale: "ar" | "en";
  amount: number;
  currency: string;
  payoutCycle: string;
}

const t = {
  ar: { title: "إشعار دفع", amount: "المبلغ", cycle: "دورة الدفع", footer: "سوار الذهب" },
  en: { title: "Payout Notification", amount: "Amount", cycle: "Payout Cycle", footer: "Suwar Al Dhahab" },
};

export function PayoutNotificationEmail({ locale, amount, currency, payoutCycle }: PayoutEmailProps) {
  const tr = t[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div dir={dir} style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1 style={{ color: "#c5a028" }}>{tr.title}</h1>
      <p>{tr.amount}: {amount.toFixed(2)} {currency}</p>
      <p>{tr.cycle}: {payoutCycle}</p>
      <p style={{ marginTop: 24, color: "#666", fontSize: 14 }}>{tr.footer}</p>
    </div>
  );
}
