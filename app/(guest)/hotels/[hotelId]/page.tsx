"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { motion, useReducedMotion } from "motion/react";
import { Star, MapPin, Clock, ShieldCheck, ArrowLeft, ArrowRight, Heart } from "@phosphor-icons/react";
import Link from "next/link";
import { PhotoGallery } from "@/components/property-detail/photo-gallery";
import { LocationMap } from "@/components/property-detail/location-map";
import { AmenitiesList } from "@/components/property-detail/amenities-list";
import { ReviewsSection } from "@/components/property-detail/reviews-section";
import { WriteReview } from "@/components/property-detail/write-review";
import { AvailableRooms } from "@/components/property-detail/available-rooms";
import FavoriteToggle from "@/components/guest-account/favorite-toggle";

export default function HotelDetailPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = use(params);
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface"><div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" /></div>}>
      <HotelDetailContent hotelId={hotelId} />
    </Suspense>
  );
}

function HotelDetailContent({ hotelId }: { hotelId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [hotel, setHotel] = useState<any>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reduce = useReducedMotion();

  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

  useEffect(() => {
    setError(false);
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    fetch(`/api/hotels/${hotelId}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load hotel");
        return res.json();
      })
      .then(setHotel)
      .catch(() => setError(true));
  }, [hotelId, checkIn, checkOut, reloadKey]);

  if (error) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-on-surface">{t.search.noResults}</p>
          <Link href="/" className="btn btn-secondary mt-4">
            <ArrowLeft size={16} weight="bold" className="rtl:rotate-180" aria-hidden />
            {locale === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </main>
    );
  }

  if (!hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  const name = locale === "ar" ? hotel.nameAr : hotel.nameEn;
  const description = locale === "ar" ? hotel.descriptionAr : hotel.descriptionEn;
  const heroImage =
    hotel.photos?.[0] ||
    hotel.gallery?.[0]?.url ||
    `https://picsum.photos/seed/sewar-hotel-${hotelId.slice(-6)}/1920/1080`;

  const galleryImages = (hotel.gallery ?? []).length > 0
    ? (hotel.gallery ?? []).map((m: any) => ({ url: m.url, captionAr: m.captionAr, captionEn: m.captionEn, sortOrder: m.sortOrder }))
    : (hotel.photos ?? []).length > 0
    ? (hotel.photos ?? []).map((url: string, i: number) => ({ url, captionAr: name, captionEn: name, sortOrder: i }))
    : Array.from({ length: 5 }).map((_, i) => ({ url: `https://picsum.photos/seed/sewar-hotel-${hotelId.slice(-4)}-${i}/800/600`, captionAr: name, captionEn: name, sortOrder: i }));

  const startPrice = hotel.roomTypes?.[0]?.basePrice;
  const price = startPrice
    ? typeof startPrice === "object" && "toNumber" in startPrice
      ? (startPrice as { toNumber: () => number }).toNumber()
      : Number(startPrice) || 0
    : 0;

  return (
    <main className="bg-surface">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden bg-surface-dark">
        <motion.img
          initial={reduce ? {} : { scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, ease: [0.2, 0, 0, 1] }}
          src={heroImage}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover img-elegant"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-dark/50 via-surface-dark/30 to-surface-dark/90" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-8 lg:px-8 lg:pb-12">
          {/* Back link */}
          <Link href="/" className="mb-auto mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-medium text-on-dark/85 backdrop-blur-sm transition-colors hover:border-primary hover:text-primary" style={{ width: "fit-content" }}>
            <ArrowRight size={14} weight="bold" className="rtl:rotate-0" aria-hidden />
            {locale === "ar" ? "كل الفنادق" : "All Hotels"}
          </Link>

          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          >
            <div className="mb-3 flex items-center gap-1 text-primary" aria-label={`${hotel.starRating} ${locale === "ar" ? "نجوم" : "stars"}`}>
              {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                <Star key={i} size={17} weight="fill" aria-hidden />
              ))}
            </div>
            <h1 className="display-sm max-w-2xl font-display text-on-dark">{name}</h1>
            <p className="mt-3 flex items-center gap-2 text-base text-on-dark/75">
              <MapPin size={17} weight="light" className="text-primary" aria-hidden />
              {hotel.city}
              {hotel.address ? ` · ${hotel.address}` : ""}
            </p>
            {hotel.avgRating != null && (
              <div className="mt-4 flex items-center gap-3">
                <span className="font-display text-2xl font-bold text-primary" style={{ fontVariantNumeric: "tabular-nums" }}>{hotel.avgRating.toFixed(1)}</span>
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={15} weight={i < Math.round(hotel.avgRating) ? "fill" : "regular"} className={i < Math.round(hotel.avgRating) ? "text-primary" : "text-on-dark/25"} />
                  ))}
                </div>
                <span className="text-sm text-on-dark/60">{hotel.reviewCount ?? 0} {t.propertyDetail.basedOnReviews}</span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Sticky booking bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-surface-raised/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-on-surface">{name}</p>
            {price > 0 && (
              <p className="text-sm text-on-surface-muted">
                {locale === "ar" ? "يبدأ من" : "From"} <span className="font-bold text-primary" style={{ fontVariantNumeric: "tabular-nums" }}>{price} {locale === "ar" ? "ر.س" : "SAR"}</span>
                <span className="text-xs"> / {t.propertyDetail.perNight}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FavoriteToggle hotelId={hotelId} />
            <button
              onClick={() => {
                if (checkIn && checkOut) {
                  const rt = hotel.roomTypes?.[0];
                  if (rt) {
                    const params = new URLSearchParams({ hotelId, roomTypeId: rt.id, checkIn, checkOut, quantity: "1" });
                    router.push(`/booking/checkout?${params.toString()}`);
                  }
                } else {
                  document.getElementById("rooms-section")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="btn btn-primary text-xs"
            >
              {checkIn && checkOut ? t.propertyDetail.proceedToBooking : t.propertyDetail.selectDates}
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <Section>
        <SectionHeading title={t.propertyDetail.gallery} />
        <PhotoGallery images={galleryImages} />
      </Section>

      {/* Description */}
      {description && (
        <Section>
          <motion.div initial={reduce ? {} : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }} className="mx-auto max-w-3xl">
            <h2 className="display-sm mb-4 font-display text-on-surface">{locale === "ar" ? "نبذة عن الفندق" : "About This Hotel"}</h2>
            <p className="text-lg leading-relaxed text-on-surface-muted">{description}</p>
          </motion.div>
        </Section>
      )}

      {/* Amenities */}
      <Section bg="muted">
        <AmenitiesList amenities={hotel.amenities ?? []} />
      </Section>

      {/* Available rooms */}
      <Section>
        <SectionHeading title={t.propertyDetail.availableRooms} />
        <AvailableRooms roomTypes={hotel.roomTypes ?? []} hotelId={hotelId} checkIn={checkIn} checkOut={checkOut} />
      </Section>

      {/* Location */}
      <Section bg="muted">
        <SectionHeading title={t.propertyDetail.location} />
        <LocationMap latitude={hotel.latitude ?? null} longitude={hotel.longitude ?? null} locale={locale} />
      </Section>

      {/* Reviews */}
      <Section>
        <SectionHeading title={t.propertyDetail.reviews} />
        <WriteReview hotelId={hotelId} onSubmitted={() => setReloadKey((k) => k + 1)} />
        <ReviewsSection reviews={hotel.reviews ?? []} avgRating={hotel.avgRating ?? null} reviewCount={hotel.reviewCount ?? 0} />
      </Section>

      {/* Policies + Host */}
      <Section bg="muted">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={22} className="text-primary-hover" weight="light" aria-hidden />
              <h3 className="font-display text-lg font-bold text-on-surface">{t.propertyDetail.policies}</h3>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <dt className="flex items-center gap-2 text-on-surface-muted"><Clock size={15} weight="light" aria-hidden />{t.propertyDetail.checkInTime}</dt>
                <dd className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{hotel.checkInTime}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <dt className="flex items-center gap-2 text-on-surface-muted"><Clock size={15} weight="light" aria-hidden />{t.propertyDetail.checkOutTime}</dt>
                <dd className="font-semibold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{hotel.checkOutTime}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-muted">{t.propertyDetail.cancellationPolicy}</dt>
                <dd className="font-semibold text-on-surface">{hotel.cancellationPolicyHours} {t.propertyDetail.hoursBeforeCheckIn}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm font-medium text-primary-hover">{t.propertyDetail.freeCancellation}</p>
          </div>

          {hotel.host && (
            <div className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint">
                  <Heart size={24} className="text-primary-hover" weight="light" aria-hidden />
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface">{t.propertyDetail.hostInfo}</h3>
              </div>
              <p className="font-semibold text-on-surface">{hotel.host.name}</p>
              {hotel.host.joinedAt && (
                <p className="mt-1 text-sm text-on-surface-muted">
                  {locale === "ar" ? "انضم في" : "Joined"} {new Date(hotel.host.joinedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long" })}
                </p>
              )}
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}

function Section({ children, bg }: { children: React.ReactNode; bg?: "muted" }) {
  return (
    <section className={`mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16 ${bg === "muted" ? "bg-surface-muted" : ""}`}>
      {children}
    </section>
  );
}

function SectionHeading({ title }: { title: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.h2
      initial={reduce ? {} : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
      className="mb-6 font-display text-2xl font-bold text-on-surface md:text-3xl"
    >
      {title}
    </motion.h2>
  );
}
