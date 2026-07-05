"use client";

import { useLanguage } from "@/app/providers";

export default function Marquee() {
  const { locale } = useLanguage();

  const items = locale === "ar"
    ? ["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "العُلا", "البحر الأحمر", "الدمام", "الخبر", "أبها", "تبوك"]
    : ["Riyadh", "Jeddah", "Makkah", "Madinah", "AlUla", "Red Sea", "Dammam", "Khobar", "Abha", "Tabuk"];

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-gold/15 bg-surface-dark py-6">
      <div className="marquee-track items-center gap-8">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
            <span className="font-display text-2xl font-bold text-on-dark/40 transition-colors hover:text-gold-bright md:text-3xl">
              {item}
            </span>
            <span className="ornament-diamond opacity-40" />
          </span>
        ))}
      </div>
    </section>
  );
}
