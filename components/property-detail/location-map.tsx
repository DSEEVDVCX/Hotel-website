"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { useLanguage } from "@/app/providers";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, NavigationArrow, MapTrifold } from "@phosphor-icons/react";

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  locale: "ar" | "en";
}

export function LocationMap({ latitude, longitude, locale }: LocationMapProps) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const mapRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (latitude == null || longitude == null || !mapRef.current) return;
    let cancelled = false;
    setLoadError(false);
    loadGoogleMaps(locale)
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        const position = { lat: latitude, lng: longitude };
        const map = new google.maps.Map(mapRef.current, {
          center: position, zoom: 14, mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "simplified" }] },
            { featureType: "transit", stylers: [{ visibility: "simplified" }] },
          ],
        });
        new google.maps.Marker({ position, map, title: t.propertyDetail.location });
      })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [latitude, longitude, locale, t]);

  const directionsUrl = latitude != null && longitude != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : "#";

  if (latitude == null || longitude == null) {
    return (
      <div data-testid="property-map" className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-muted p-12 text-center">
        <MapTrifold size={48} className="text-primary-hover" weight="light" aria-hidden />
        <p className="mt-3 text-sm text-on-surface-muted">{t.propertyDetail.location}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
      data-testid="property-map"
      className="overflow-hidden rounded-2xl border border-border shadow-md"
    >
      <div className="relative">
        <div ref={mapRef} dir={locale === "ar" ? "rtl" : "ltr"} role="application" aria-label={t.propertyDetail.location} className="h-80 w-full md:h-96" />
        <div className="pointer-events-none absolute start-4 top-4 flex items-center gap-2 rounded-full bg-surface-raised/90 px-4 py-2 text-sm font-medium text-on-surface shadow-md backdrop-blur-sm">
          <MapPin size={16} className="text-primary" weight="fill" aria-hidden />
          {t.propertyDetail.location}
        </div>
      </div>
      {loadError && <p className="p-4 text-sm text-on-surface-muted">{t.propertyDetail.location}</p>}
      <div className="flex items-center justify-between border-t border-border bg-surface-raised p-4">
        <p className="text-sm text-on-surface-muted">{locale === "ar" ? "احصل على الاتجاهات إلى الفندق" : "Get directions to the hotel"}</p>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-xs">
          <NavigationArrow size={16} aria-hidden />
          {t.propertyDetail.getDirections}
        </a>
      </div>
    </motion.div>
  );
}
