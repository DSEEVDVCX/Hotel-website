import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  react: React.ReactElement
) {
  return resend.emails.send({
    from: "Suwar Al Dhahab <no-reply@suweraldhahab.sa>",
    to,
    subject,
    react,
  });
}

export async function sendBookingConfirmation(
  to: string,
  locale: "ar" | "en",
  booking: {
    id: string;
    hotelNameAr: string;
    hotelNameEn: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    currency: string;
  }
) {
  const { BookingConfirmationEmail } = await import("@/lib/email-templates/BookingConfirmation");
  const subject = locale === "ar" ? "تأكيد حجزك — سوار الذهب" : "Booking Confirmation — Suwar Al Dhahab";
  return sendEmail(to, subject, BookingConfirmationEmail({ locale, booking }));
}
