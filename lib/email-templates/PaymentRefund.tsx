import * as React from "react";

interface RefundEmailProps {
  locale: "ar" | "en";
  refundAmount: number;
  currency: string;
  hotelNameAr: string;
  hotelNameEn: string;
}

const t = {
  ar: { title: "تم إلغاء حجزك", refund: "المبلغ المسترد", hotel: "الفندق", footer: "سوار الذهب" },
  en: { title: "Booking Cancelled", refund: "Refund Amount", hotel: "Hotel", footer: "Suwar Al Dhahab" },
};

export function PaymentRefundEmail({ locale, refundAmount, currency, hotelNameAr, hotelNameEn }: RefundEmailProps) {
  const tr = t[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div dir={dir} style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1 style={{ color: "#c5a028" }}>{tr.title}</h1>
      <p>{tr.hotel}: {locale === "ar" ? hotelNameAr : hotelNameEn}</p>
      <p>{tr.refund}: {refundAmount.toFixed(2)} {currency}</p>
      <p style={{ marginTop: 24, color: "#666", fontSize: 14 }}>{tr.footer}</p>
    </div>
  );
}
