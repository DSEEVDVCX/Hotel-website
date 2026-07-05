"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/app/providers";
import { loadGoogleMaps } from "@/lib/google-maps";

const RIYADH: google.maps.LatLngLiteral = { lat: 24.7136, lng: 46.6753 };

export default function ContactMap() {
  const { t, locale } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps(locale)
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: RIYADH,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        new google.maps.Marker({
          position: RIYADH,
          map,
          title: t.contact.info.address,
        });
      })
      .catch(() => {
        // Google Maps unavailable (e.g. missing API key); contact details remain.
      });

    return () => {
      cancelled = true;
    };
  }, [locale, t.contact.info.address]);

  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${RIYADH.lat},${RIYADH.lng}`;
  const phoneHref = `tel:${t.contact.info.phone.replace(/[^+\d]/g, "")}`;

  return (
    <section className="mt-16 md:mt-24">
      <span className="eyebrow mb-6">{t.aboutUs.contactUs}</span>
      <h2 className="font-display text-2xl font-semibold leading-tight text-on-surface md:text-3xl">
        {t.aboutUs.findUs}
      </h2>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col justify-center gap-6">
          <p className="text-lg font-medium text-on-surface">
            {t.contact.info.address}
          </p>
          <div className="space-y-2">
            <a
              href={`mailto:${t.contact.info.email}`}
              className="block text-on-surface-muted transition-colors hover:text-gold"
            >
              {t.contact.info.email}
            </a>
            <a
              href={phoneHref}
              className="block text-on-surface-muted transition-colors hover:text-gold"
            >
              {t.contact.info.phone}
            </a>
          </div>
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex w-fit items-center px-6 py-3 text-sm"
          >
            {t.aboutUs.directions}
          </a>
        </div>

        <div
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="overflow-hidden border border-border bg-surface-muted"
          style={{ borderRadius: 2 }}
        >
          <div
            ref={mapRef}
            data-testid="about-map"
            aria-label={t.aboutUs.findUs}
            className="h-80 w-full"
          />
        </div>
      </div>
    </section>
  );
}
