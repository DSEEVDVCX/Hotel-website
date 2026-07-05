"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ArrowRight,
  EnvelopeSimple,
  Phone,
  Calendar,
  SuitcaseRolling,
  Heart,
  Star,
  MapPin,
} from "@phosphor-icons/react";

type UserDetails = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  phoneNumber: string | null;
  createdAt: string;
  _count: { bookings: number; favorites: number; reviews: number };
};

type BookingItem = {
  id: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  hotel: { nameAr: string; nameEn: string; city: string };
  payment: { amount: number; status: string } | null;
};

type FavoriteHotel = {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  starRating: number;
};

const statusColors: Record<string, string> = {
  CONFIRMED: "text-success",
  CANCELLED: "text-error",
  CHECKED_IN: "text-primary",
  COMPLETED: "text-on-surface-subtle",
  PENDING: "text-gold-deep",
  FAILED: "text-error",
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { locale, t } = useLanguage();
  const [data, setData] = useState<{
    user: UserDetails;
    bookings: BookingItem[];
    favorites: FavoriteHotel[];
    totalSpent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const adminRole = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (adminRole !== "ADMIN") return;
    fetch(`/api/admin/users/${id}/details`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, adminRole]);

  if (adminRole !== "ADMIN") return <EmptyState />;

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      </main>
    );
  }

  if (!data) return <EmptyState />;

  const { user, bookings, favorites, totalSpent } = data;
  const currency = locale === "ar" ? "ر.س" : "SAR";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin/users" className="mb-6 inline-flex items-center gap-1 text-sm text-on-surface-muted hover:text-gold">
        <ArrowRight size={14} weight="bold" className="rtl:rotate-180" aria-hidden />
        {t.admin.users}
      </Link>

      {/* Profile card */}
      <section className="card mb-8 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface">{user.name}</h1>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2 text-on-surface-muted">
                <EnvelopeSimple size={16} weight="light" aria-hidden />
                {user.email}
              </p>
              {user.phoneNumber && (
                <p className="flex items-center gap-2 text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <Phone size={16} weight="light" aria-hidden />
                  {user.phoneNumber}
                </p>
              )}
              <p className="flex items-center gap-2 text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                <Calendar size={16} weight="light" aria-hidden />
                {t.admin.joined}: {new Date(user.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.role === "ADMIN" ? "bg-gold/10 text-gold-deep" : "bg-primary-tint text-primary"}`}>
              {user.role === "ADMIN" ? t.admin.adminRole : t.admin.guest}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.status === "ACTIVE" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
              {user.status === "ACTIVE" ? t.admin.active : t.admin.suspended}
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
            <SuitcaseRolling size={20} weight="light" aria-hidden />
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{user._count.bookings}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">{t.admin.bookings}</p>
        </div>
        <div className="card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
            <Heart size={20} weight="light" aria-hidden />
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>{user._count.favorites}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">{t.admin.favorites}</p>
        </div>
        <div className="card p-5 col-span-2 md:col-span-1">
          <p className="mt-[3.25rem] font-display text-2xl font-bold text-gold-deep" style={{ fontVariantNumeric: "tabular-nums" }}>
            {totalSpent.toLocaleString("en-US", { maximumFractionDigits: 0 })} {currency}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">{t.admin.totalSpent}</p>
        </div>
      </div>

      {/* Bookings */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
          <SuitcaseRolling size={20} weight="light" className="text-gold-deep" aria-hidden />
          {t.admin.bookings} ({bookings.length})
        </h2>
        {bookings.length === 0 ? (
          <EmptyState message={t.guestAccount.noBookings} />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const hotelName = locale === "ar" ? b.hotel.nameAr : b.hotel.nameEn;
              return (
                <div key={b.id} className="card flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-on-surface">{hotelName}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                      <Calendar size={12} weight="light" aria-hidden />
                      {new Date(b.checkIn).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")} →{" "}
                      {new Date(b.checkOut).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {t.booking.total}: {Number(b.totalPrice)} {currency}
                      {b.payment && ` · ${b.payment.status}`}
                    </p>
                  </div>
                  <span className={`whitespace-nowrap text-xs font-semibold ${statusColors[b.status] || "text-on-surface-muted"}`}>
                    {b.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Favorites */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
          <Heart size={20} weight="light" className="text-gold-deep" aria-hidden />
          {t.admin.favorites} ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <EmptyState message={t.guestAccount.noFavorites} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((f) => (
              <Link key={f.id} href={`/hotels/${f.id}`} className="card p-4 transition-colors hover:border-gold/40">
                <p className="font-display font-bold text-on-surface">{locale === "ar" ? f.nameAr : f.nameEn}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-on-surface-muted">
                  <MapPin size={12} weight="light" aria-hidden />
                  {f.city}
                </p>
                <div className="mt-2 flex items-center gap-0.5 text-gold">
                  {Array.from({ length: f.starRating }).map((_, i) => (
                    <Star key={i} size={11} weight="fill" aria-hidden />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
