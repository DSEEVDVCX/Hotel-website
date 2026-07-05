"use client";

import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { SearchBar } from "@/components/search/SearchBar";
import { ResultCard } from "@/components/search/ResultCard";
import { Suspense, useEffect, useState } from "react";
import type { AvailableRoomType } from "@/lib/availability";

export const dynamic = "force-dynamic";

function SearchResults() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<AvailableRoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const city = searchParams.get("city") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "1";

  useEffect(() => {
    if (!city || !checkIn || !checkOut) return;
    setLoading(true);
    setSearched(true);
    fetch(`/api/search?city=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [city, checkIn, checkOut, guests]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="display-sm mb-6 font-display text-on-surface">{t.search.title}</h1>

      <div className="mb-8 rounded-2xl border border-border bg-surface-raised p-5 shadow-sm">
        <SearchBar />
      </div>

      <div className="mt-8">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          )}

          {!loading && !searched && (
            <div className="rounded-2xl border border-border bg-surface-muted p-12 text-center">
              <p className="text-on-surface-muted">
                {locale === "ar" ? "ابحث عن غرفة متاحة بإدخال الوجهة والتواريخ" : "Search for available rooms by entering destination and dates"}
              </p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface-raised p-8 text-center shadow-sm">
              <p className="mb-2 text-lg font-semibold text-on-surface">{t.search.noResults}</p>
              <p className="text-sm text-on-surface-muted">
                {locale === "ar" ? "جرّب تعديل التواريخ أو الوجهة للعثور على غرف متاحة" : "Try adjusting your dates or destination to find available rooms"}
              </p>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {!loading && results.map((room) => (
              <ResultCard key={room.roomTypeId} room={room} checkIn={checkIn} checkOut={checkOut} />
            ))}
          </div>
        </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="px-5 py-8"><div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" /></main>}>
      <SearchResults />
    </Suspense>
  );
}
