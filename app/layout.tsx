import type { Metadata } from "next";
import { Tajawal, Amiri, Reem_Kufi, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider, ThemeProvider, AuthSessionProvider } from "./providers";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-ar",
  display: "swap",
});

// Luxury classical Arabic display font for headings
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-ar",
  display: "swap",
});

// Modern Kufic for Arabic UI labels / numbers
const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kufi",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-en",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سوار الأندلس | ضيافة فاخرة بأناقة الأندلس",
  description:
    "وجهة ضيافة راقية تجمع نخبة الفنادق المختارة بعناية. تصفّح الغرف والأجنحة واحجز إقامتك المثالية مع سوار الأندلس.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${tajawal.variable} ${amiri.variable} ${reemKufi.variable} ${playfair.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthSessionProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
