import * as React from "react";

interface BookingConfirmationProps {
  locale: "ar" | "en";
  booking: {
    id: string;
    hotelNameAr: string;
    hotelNameEn: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    currency: string;
  };
}

const t = {
  ar: {
    title: "تم تأكيد حجزك",
    greeting: "شكراً لحجزك معنا! تم تأكيد حجزك بنجاح.",
    bookingId: "رقم الحجز",
    hotel: "الفندق",
    checkIn: "تاريخ الوصول",
    checkOut: "تاريخ المغادرة",
    total: "الإجمالي",
    footer: "سوار الذهب — وجهةٌ ذهبية فاخرة",
  },
  en: {
    title: "Booking Confirmed",
    greeting: "Thank you for booking with us! Your reservation has been confirmed.",
    bookingId: "Booking ID",
    hotel: "Hotel",
    checkIn: "Check-in",
    checkOut: "Check-out",
    total: "Total",
    footer: "Suwar Al Dhahab — A Luxury Golden Destination",
  },
};

export function BookingConfirmationEmail({ locale, booking }: BookingConfirmationProps) {
  const tr = t[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const hotelName = locale === "ar" ? booking.hotelNameAr : booking.hotelNameEn;

  return (
    <div dir={dir} style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1 style={{ color: "#c5a028" }}>{tr.title}</h1>
      <p>{tr.greeting}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <tbody>
          <tr>
            <td style={{ padding: "8px 0", fontWeight: "bold" }}>{tr.bookingId}:</td>
            <td style={{ padding: "8px 0" }}>{booking.id}</td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0", fontWeight: "bold" }}>{tr.hotel}:</td>
            <td style={{ padding: "8px 0" }}>{hotelName}</td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0", fontWeight: "bold" }}>{tr.checkIn}:</td>
            <td style={{ padding: "8px 0" }}>{booking.checkIn}</td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0", fontWeight: "bold" }}>{tr.checkOut}:</td>
            <td style={{ padding: "8px 0" }}>{booking.checkOut}</td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0", fontWeight: "bold" }}>{tr.total}:</td>
            <td style={{ padding: "8px 0" }}>{booking.totalPrice.toFixed(2)} {booking.currency}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginTop: 24, color: "#666", fontSize: 14 }}>{tr.footer}</p>
    </div>
  );
}
