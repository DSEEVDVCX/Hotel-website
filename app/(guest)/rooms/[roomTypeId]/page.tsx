"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { motion, useReducedMotion } from "motion/react";
import { Star, Users, Bed, Ruler, ArrowRight, MapPin, ShieldCheck, Clock, Check } from "@phosphor-icons/react";
import { PhotoGallery } from "@/components/property-detail/photo-gallery";
import type { RoomTypeDetail } from "@/lib/room-types";

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

export default function RoomDetailPage({ params }: { params: Promise<{ roomTypeId: string }> }) {
  const { roomTypeId } = use(params);
  const { locale, t } = useLanguage();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [room, setRoom] = useState<RoomTypeDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/room-types/${roomTypeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then(setRoom)
      .catch(() => setError(true));
  }, [roomTypeId]);

  if (error) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-on-surface">{t.search.noResults}</p>
          <Link href="/" className="btn btn-secondary mt-4">
            <ArrowRight size={16} weight="bold" className="rtl:rotate-180" aria-hidden />
            {locale === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  const name = locale === "ar" ? room.nameAr : room.nameEn;
  const description = locale === "ar" ? room.descriptionAr : room.descriptionEn;
  const hotelName = locale === "ar" ? room.hotelNameAr : room.hotelNameEn;
  const currency = locale === "ar" ? "ر.س" : "SAR";
  const guestsLabel = locale === "ar" ? "ضيوف" : "guests";

  return (
    <main className="bg-surface pt-16">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden bg-surface-dark">
          <motion.img
            initial={reduce ? {} : { scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, ease: [0.2, 0, 0, 1] }}
            src={room.photos?.[0] || room.gallery?.[0]?.url || `https://picsum.photos/seed/sewar-room-${roomTypeId.slice(-6)}/1920/1080`}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover img-elegant"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark/40 via-surface-dark/30 to-surface-dark/85" />
          <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-8 lg:px-8">
            <Link href="/" className="mb-auto mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-medium text-on-dark/85 backdrop-blur-sm transition-colors hover:border-primary hover:text-primary" style={{ width: "fit-content" }}>
              <ArrowRight size={14} weight="bold" className="rtl:rotate-180" aria-hidden />
              {locale === "ar" ? "كل الغرف" : "All Rooms"}
            </Link>
            <motion.div initial={reduce ? {} : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}>
              <div className="mb-2 flex items-center gap-1 text-gold-bright" aria-label={`${room.starRating} ${locale === "ar" ? "نجوم" : "stars"}`}>
                {Array.from({ length: room.starRating }).map((_, i) => <Star key={i} size={16} weight="fill" aria-hidden />)}
              </div>
              <h1 className="display-sm font-display text-on-dark">{name}</h1>
              <p className="mt-2 flex items-center gap-2 text-base text-on-dark/75">
                <MapPin size={16} weight="light" className="text-gold-bright" aria-hidden />
                {hotelName} · {room.city}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content + Booking sidebar */}
        <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Quick specs */}
              <div className="mb-8 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-surface-raised p-4 text-center shadow-sm">
                  <Users size={24} className="mx-auto text-primary-hover" weight="light" aria-hidden />
                  <p className="mt-2 font-display text-lg font-bold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{room.capacity}</p>
                  <p className="text-xs text-on-surface-muted">{guestsLabel}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-raised p-4 text-center shadow-sm">
                  <Bed size={24} className="mx-auto text-primary-hover" weight="light" aria-hidden />
                  <p className="mt-2 font-display text-sm font-bold text-on-surface">{room.bedType}</p>
                  <p className="text-xs text-on-surface-muted">{locale === "ar" ? "نوع السرير" : "Bed Type"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-raised p-4 text-center shadow-sm">
                  <Ruler size={24} className="mx-auto text-primary-hover" weight="light" aria-hidden />
                  <p className="mt-2 font-display text-lg font-bold text-on-surface">{locale === "ar" ? "فاخر" : "Premium"}</p>
                  <p className="text-xs text-on-surface-muted">{locale === "ar" ? "مساحة" : "Space"}</p>
                </div>
              </div>

              {/* Description */}
              {description && (
                <div className="mb-8">
                  <h2 className="mb-3 font-display text-xl font-bold text-on-surface">{locale === "ar" ? "نبذة عن الغرفة" : "About This Room"}</h2>
                  <p className="text-base leading-relaxed text-on-surface-muted">{description}</p>
                </div>
              )}

              {/* Gallery */}
              <div className="mb-8">
                <h2 className="mb-4 font-display text-xl font-bold text-on-surface">{t.propertyDetail.gallery}</h2>
                <PhotoGallery images={room.gallery} />
              </div>

              {/* Amenities */}
              {room.amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 font-display text-xl font-bold text-on-surface">{t.propertyDetail.amenities}</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {room.amenities.map((amenity, i) => {
                      const key = amenity.toLowerCase();
                      const label = AMENITY_LABELS[key] ? (locale === "ar" ? AMENITY_LABELS[key].ar : AMENITY_LABELS[key].en) : amenity;
                      return (
                        <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-raised p-3">
                          <Check size={18} className="text-primary-hover" weight="light" aria-hidden />
                          <span className="text-sm font-medium text-on-surface">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hotel policies */}
              <div>
                <h2 className="mb-4 font-display text-xl font-bold text-on-surface">{t.propertyDetail.policies}</h2>
                <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-sm">
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <dt className="flex items-center gap-2 text-on-surface-muted"><Clock size={15} weight="light" aria-hidden />{t.propertyDetail.checkInTime}</dt>
                      <dd className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{room.hotel.checkInTime}</dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <dt className="flex items-center gap-2 text-on-surface-muted"><Clock size={15} weight="light" aria-hidden />{t.propertyDetail.checkOutTime}</dt>
                      <dd className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{room.hotel.checkOutTime}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-on-surface-muted"><ShieldCheck size={15} weight="light" aria-hidden />{t.propertyDetail.cancellationPolicy}</dt>
                      <dd className="font-semibold text-on-surface">{room.hotel.cancellationPolicyHours} {t.propertyDetail.hoursBeforeCheckIn}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm font-medium text-primary-hover">{t.propertyDetail.freeCancellation}</p>
                </div>
              </div>
            </div>

            {/* Booking sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-border bg-surface-raised p-6 shadow-md">
                <div className="mb-4 flex items-baseline justify-between">
                  <div>
                    <span className="font-display text-3xl font-bold text-primary-hover" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {room.basePrice.toLocaleString()} {currency}
                    </span>
                    <span className="text-sm text-on-surface-muted"> / {t.propertyDetail.perNight}</span>
                  </div>
                </div>

                {room.availableRoomsCount > 0 ? (
                  <p className="mb-4 flex items-center gap-2 text-sm text-success">
                    <Check size={16} weight="light" aria-hidden />
                    {room.availableRoomsCount} {t.search.availableRooms}
                  </p>
                ) : (
                  <p className="mb-4 text-sm text-error">{t.search.noResults}</p>
                )}

                <button
                  onClick={() => {
                    const params = new URLSearchParams({
                      roomTypeId: room.id,
                      hotelId: room.hotelId,
                    });
                    router.push(`/booking/checkout?${params.toString()}`);
                  }}
                  className="btn btn-primary w-full"
                  disabled={room.availableRoomsCount === 0}
                >
                  {t.search.bookNow}
                  <ArrowRight size={16} weight="bold" className="rtl:rotate-180" aria-hidden />
                </button>

                <p className="mt-3 text-center text-xs text-on-surface-subtle">
                  {locale === "ar" ? "اختر تواريخ إقامتك في الخطوة التالية" : "Choose your stay dates in the next step"}
                </p>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs font-medium text-on-surface-muted">{hotelName}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-on-surface-subtle">
                    <MapPin size={12} weight="light" aria-hidden />
                    {room.city} · {room.hotel.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
