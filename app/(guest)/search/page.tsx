"use client";

import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { SearchBar } from "@/components/search/SearchBar";
import { ResultCard } from "@/components/search/ResultCard";
import { Suspense, useEffect, useState } from "react";
import type { AvailableRoomType } from "@/lib/availability";

export const dynamic = 'force-dynamic';

function SearchResults() {
  const { t } = useLanguage();
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
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">{t.search.title}</h1>
      <SearchBar />
      <div className="mt-8">
        {loading && <p className="text-[var(--color-text-muted)]">...</p>}
        {!loading && searched && results.length === 0 && (
          <p className="text-[var(--color-text-muted)]">{t.search.noResults}</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
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
    <Suspense fallback={<main className="px-4 py-8">...</main>}>
      <SearchResults />
    </Suspense>
  );
}
