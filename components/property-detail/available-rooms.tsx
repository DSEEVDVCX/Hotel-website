"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/app/providers";
import { motion, useReducedMotion } from "motion/react";
import { Users, Bed, ArrowRight } from "@phosphor-icons/react";

interface AvailableRoomsProps {
  roomTypes: any[];
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: string;
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === "object" && value !== null) {
    const v = value as { toNumber?: () => number };
    if (typeof v.toNumber === "function") return v.toNumber();
  }
  return 0;
}

export function AvailableRooms({ roomTypes, hotelId, checkIn, checkOut, guests }: AvailableRoomsProps) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const reduce = useReducedMotion();
  const currency = locale === "ar" ? "ر.س" : "SAR";

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Number.isFinite(diff) && diff > 0 ? diff : 0;
  })();

  const handleProceed = (roomTypeId: string) => {
    const params = new URLSearchParams({
      hotelId,
      roomTypeId,
      checkIn: checkIn || new Date().toISOString().slice(0, 10),
      checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      guests,
      quantity: "1",
    });
    router.push(`/booking/checkout?${params.toString()}`);
  };

  if (!roomTypes || roomTypes.length === 0) {
    return (
      <div data-testid="property-rooms" id="rooms-section" className="scroll-mt-20">
        <p className="text-on-surface-muted">{t.search.noResults}</p>
      </div>
    );
  }

  return (
    <div data-testid="property-rooms" id="rooms-section" className="scroll-mt-20 grid gap-5">
      {roomTypes.map((rt, idx) => {
        const name = locale === "ar" ? rt.nameAr : rt.nameEn;
        const description = locale === "ar" ? rt.descriptionAr : rt.descriptionEn;
        const basePrice = toNumber(rt.basePrice);
        const perStay = basePrice * nights;
        const available = rt.rooms?.length ?? 0;
        const photo = rt.gallery?.[0]?.url ?? rt.photos?.[0] ?? `https://picsum.photos/seed/sewar-room-${rt.id?.slice(-4) || idx}/600/400`;
        const bookable = available > 0 || !checkIn;

        return (
          <motion.div
            key={rt.id}
            initial={reduce ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.2, 0, 0, 1] }}
          >
            <div className="card group overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="relative h-52 w-full overflow-hidden md:h-auto md:w-64 shrink-0">
                  <Image src={photo} alt={name ?? ""} fill unoptimized sizes="(min-width: 768px) 16rem, 100vw" className="object-cover img-elegant transition-transform duration-500 group-hover:scale-105" style={{ transitionTimingFunction: "var(--ease-standard)" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-on-surface">{name}</h3>
                      {description && <p className="mt-1 line-clamp-2 text-sm text-on-surface-muted">{description}</p>}
                    </div>
                    {available > 0 && (
                      <span className="shrink-0 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                        {available} {t.search.availableRooms}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-muted">
                    <span className="inline-flex items-center gap-1.5"><Users size={16} weight="light" className="text-primary-hover" aria-hidden />{rt.capacity} {t.dashboard.capacity}</span>
                    <span className="inline-flex items-center gap-1.5"><Bed size={16} weight="light" className="text-primary-hover" aria-hidden />{rt.bedType}</span>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
                    <div>
                      <span className="font-display text-2xl font-bold text-primary-hover" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {basePrice.toFixed(0)} {currency}
                      </span>
                      <span className="ms-1 text-xs text-on-surface-muted">/ {t.propertyDetail.perNight}</span>
                      {nights > 0 && (
                        <p className="mt-1 text-sm text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {perStay.toFixed(0)} {currency} · {nights} {locale === "ar" ? "ليلة" : "nights"}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!bookable}
                      onClick={() => handleProceed(rt.id)}
                      data-testid="proceed-to-booking"
                      className="btn btn-primary text-xs"
                    >
                      {bookable ? t.propertyDetail.proceedToBooking : t.search.bookNow}
                      <ArrowRight size={14} weight="bold" className="rtl:rotate-180" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
