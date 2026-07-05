"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/providers";
import { useSession } from "next-auth/react";
import {
  CalendarDots,
  CreditCard,
  Heart,
  SuitcaseRolling,
  ArrowRight,
  EnvelopeSimple,
  Phone,
  UserCircle,
  Calendar,
} from "@phosphor-icons/react";

type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  hotel: { nameAr: string; nameEn: string; city: string };
};

type UserInfo = {
  name: string;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  CONFIRMED: "text-success",
  CANCELLED: "text-error",
  CHECKED_IN: "text-primary",
  COMPLETED: "text-on-surface-subtle",
  PENDING: "text-gold-deep",
  FAILED: "text-error",
};

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="card h-full p-5 transition-colors hover:border-gold/40">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
          {icon}
        </span>
      </div>
      <p className="mt-4 font-display text-2xl font-bold text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      <p className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AccountOverview() {
  const { t, locale } = useLanguage();
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/favorites").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
    ])
      .then(([b, f, u]) => {
        setBookings(b.bookings || []);
        setFavoritesCount(f.favorites?.length || 0);
        setUser(u);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currency = locale === "ar" ? "ر.س" : "SAR";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN" || b.status === "PENDING"
  );
  const upcoming = active.filter((b) => new Date(b.checkIn) >= today);
  const totalSpent = bookings
    .filter((b) => b.status !== "CANCELLED" && b.status !== "FAILED")
    .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
  const recent = bookings.slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  const memberSince = user?.createdAt;

  return (
    <div className="flex flex-col gap-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<SuitcaseRolling size={20} weight="light" aria-hidden />}
          label={t.guestAccount.totalBookings}
          value={String(bookings.length)}
          href="/bookings"
        />
        <StatCard
          icon={<CalendarDots size={20} weight="light" aria-hidden />}
          label={t.guestAccount.upcomingStays}
          value={String(upcoming.length)}
          href="/bookings"
        />
        <StatCard
          icon={<CreditCard size={20} weight="light" aria-hidden />}
          label={t.guestAccount.totalSpent}
          value={`${totalSpent.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`}
        />
        <StatCard
          icon={<Heart size={20} weight="light" aria-hidden />}
          label={t.guestAccount.favoritesCount}
          value={String(favoritesCount)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent bookings */}
        <section className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-on-surface">{t.guestAccount.recentBookings}</h3>
            <Link href="/bookings" className="link-underline inline-flex items-center gap-1 text-sm font-semibold text-primary-hover">
              {t.guestAccount.viewAll}
              <ArrowRight size={14} weight="bold" className="rtl:rotate-180" aria-hidden />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-on-surface-muted">{t.guestAccount.noBookings}</p>
              <Link href="/search" className="btn btn-primary mt-4 inline-flex">
                {t.search.title}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((b) => {
                const hotelName = locale === "ar" ? b.hotel.nameAr : b.hotel.nameEn;
                return (
                  <Link
                    key={b.id}
                    href={`/booking/${b.id}`}
                    className="flex items-center justify-between py-3 transition-colors hover:bg-surface-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-on-surface">{hotelName}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                        <Calendar size={12} weight="light" aria-hidden />
                        {new Date(b.checkIn).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-gold-deep" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {Number(b.totalPrice).toLocaleString("en-US", { maximumFractionDigits: 0 })} {currency}
                      </span>
                      <span className={`text-xs font-semibold ${statusColors[b.status] || "text-on-surface-muted"}`}>
                        {b.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Account info */}
        <section className="card p-5">
          <h3 className="mb-4 font-display text-lg font-bold text-on-surface">{t.guestAccount.accountInfo}</h3>
          <dl className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-on-surface-muted">
                <UserCircle size={18} weight="light" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-on-surface-muted">{t.auth.name}</dt>
                <dd className="truncate font-medium text-on-surface">{user?.name || session?.user?.name || "—"}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-on-surface-muted">
                <EnvelopeSimple size={18} weight="light" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-on-surface-muted">{t.guestAccount.accountEmail}</dt>
                <dd className="truncate font-medium text-on-surface">{user?.email || session?.user?.email || "—"}</dd>
              </div>
            </div>
            {user?.phoneNumber && (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-on-surface-muted">
                  <Phone size={18} weight="light" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-on-surface-muted">{t.guestAccount.accountPhone}</dt>
                  <dd className="truncate font-medium text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {user.phoneNumber}
                  </dd>
                </div>
              </div>
            )}
            {memberSince && (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-on-surface-muted">
                  <Calendar size={18} weight="light" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-on-surface-muted">{t.guestAccount.memberSince}</dt>
                  <dd className="font-medium text-on-surface" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {new Date(memberSince).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long" })}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}
