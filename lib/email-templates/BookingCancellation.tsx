import * as React from "react";

interface CancellationEmailProps {
  locale: "ar" | "en";
  bookingId: string;
  hotelNameAr: string;
  hotelNameEn: string;
  refundAmount: number | null;
  currency: string;
}

const t = {
  ar: {
    title: "تم إلغاء حجزك",
    bookingId: "رقم الحجز",
    hotel: "الفندق",
    refund: "المبلغ المسترد",
    nonRefundable: "غير قابل للاسترداد حسب سياسة الإلغاء",
    footer: "سوار الذهب — وجهةٌ ذهبية فاخرة",
  },
  en: {
    title: "Booking Cancelled",
    bookingId: "Booking ID",
    hotel: "Hotel",
    refund: "Refund Amount",
    nonRefundable: "Non-refundable per cancellation policy",
    footer: "Suwar Al Dhahab — A Luxury Golden Destination",
  },
};

export function BookingCancellationEmail({ locale, bookingId, hotelNameAr, hotelNameEn, refundAmount, currency }: CancellationEmailProps) {
  const tr = t[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const hotelName = locale === "ar" ? hotelNameAr : hotelNameEn;

  return (
    <div dir={dir} style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1 style={{ color: "#c5a028" }}>{tr.title}</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <tbody>
          <tr><td style={{ padding: "8px 0", fontWeight: "bold" }}>{tr.bookingId}:</td><td>{bookingId}</td></tr>
          <tr><td style={{ padding: "8px 0", fontWeight: "bold" }}>{tr.hotel}:</td><td>{hotelName}</td></tr>
          <tr>
            <td style={{ padding: "8px 0", fontWeight: "bold" }}>{tr.refund}:</td>
            <td>{refundAmount !== null ? `${refundAmount.toFixed(2)} ${currency}` : tr.nonRefundable}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginTop: 24, color: "#666", fontSize: 14 }}>{tr.footer}</p>
    </div>
  );
}
