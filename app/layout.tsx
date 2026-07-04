import type { Metadata } from "next";
import { Tajawal, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider, ThemeProvider, AuthSessionProvider } from "./providers";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-ar",
  display: "swap",
});

// Elegant serif display for English headings — refined luxury.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display-en",
  display: "swap",
});

// Clean grotesque for English body / labels.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-en",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سوار الذهب | Suwar Al Dhahab — أسواق الذهب الفاخرة",
  description:
    "وجهة ذهبية فاخرة تجمع نخبة أسواق الذهب تحت سقفٍ واحد. عش تجربة تسوّقٍ استثنائية مع سوار الذهب.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Anti-flash: set data-theme before first paint to avoid a light→dark flicker.
  const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${tajawal.variable} ${playfair.variable} ${inter.variable} antialiased`}
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
