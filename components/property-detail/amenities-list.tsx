"use client";

import { useLanguage } from "@/app/providers";
import { motion, useReducedMotion } from "motion/react";
import {
  WifiHigh, Drop, Car, ForkKnife, Barbell, FlowerLotus,
  Wind, Bathtub, Desktop, Coffee, ShoppingBag, BellRinging, Check,
} from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";

const AMENITY_ICONS: Record<string, React.ComponentType<IconProps>> = {
  wifi: WifiHigh, pool: Drop, parking: Car, restaurant: ForkKnife,
  gym: Barbell, spa: FlowerLotus, ac: Wind, bathtub: Bathtub,
  tv: Desktop, coffee: Coffee, shop: ShoppingBag, concierge: BellRinging,
};

const AMENITY_LABELS: Record<string, { ar: string; en: string }> = {
  wifi: { ar: "واي فاي", en: "WiFi" },
  pool: { ar: "مسبح", en: "Pool" },
  parking: { ar: "موقف سيارات", en: "Parking" },
  restaurant: { ar: "مطعم", en: "Restaurant" },
  gym: { ar: "صالة رياضية", en: "Gym" },
  spa: { ar: "سبا", en: "Spa" },
  ac: { ar: "تكييف", en: "Air Conditioning" },
  bathtub: { ar: "حوض استحمام", en: "Bathtub" },
  tv: { ar: "تلفاز", en: "TV" },
  coffee: { ar: "ماكينة قهوة", en: "Coffee Machine" },
  shop: { ar: "متجر", en: "Shop" },
  concierge: { ar: "كونسيرج", en: "Concierge" },
  minibar: { ar: "ميني بار", en: "Minibar" },
  kitchenette: { ar: "مطبخ صغير", en: "Kitchenette" },
};

export function AmenitiesList({ amenities }: { amenities: string[] }) {
  const { locale, t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <div data-testid="property-amenities">
      <motion.h2
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        className="mb-6 font-display text-2xl font-bold text-on-surface md:text-3xl"
      >
        {t.propertyDetail.amenities}
      </motion.h2>

      {amenities.length === 0 ? (
        <p className="text-sm text-on-surface-muted">{t.propertyDetail.noReviews}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {amenities.map((amenity, i) => {
            const key = amenity.toLowerCase();
            const Icon = AMENITY_ICONS[key] ?? Check;
            const label = AMENITY_LABELS[key] ? (locale === "ar" ? AMENITY_LABELS[key].ar : AMENITY_LABELS[key].en) : amenity;
            return (
              <motion.div
                key={`${amenity}-${i}`}
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.2, 0, 0, 1] }}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint">
                  <Icon size={20} className="text-primary-hover" weight="light" aria-hidden />
                </div>
                <span className="text-sm font-medium text-on-surface">{label}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
