"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/app/providers";

export function AuthNav({ role }: { role: "GUEST" | "HOTELIER" | "ADMIN" }) {
  const { locale, toggle, t } = useLanguage();

  const links =
    role === "GUEST"
      ? [{ href: "/search", label: t.search.title }, { href: "/bookings", label: t.booking.myBookings }]
      : role === "HOTELIER"
      ? [{ href: "/dashboard", label: t.dashboard.title }, { href: "/dashboard/bookings", label: t.dashboard.bookings }]
      : [{ href: "/admin", label: t.admin.title }, { href: "/admin/hotels", label: t.admin.hotels }, { href: "/admin/reports", label: t.admin.reports }];

  return (
    <nav className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-[var(--color-accent)]">سوار الذهب</Link>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm text-[var(--color-text)] hover:opacity-70">
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggle} className="text-sm text-[var(--color-text-muted)]">
          {locale === "ar" ? "EN" : "ع"}
        </button>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-red-500">
          {locale === "ar" ? "خروج" : "Logout"}
        </button>
      </div>
    </nav>
  );
}
