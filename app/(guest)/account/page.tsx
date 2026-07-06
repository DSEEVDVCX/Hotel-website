"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { useSession } from "next-auth/react";
import { EmptyState } from "@/components/ui/EmptyState";
import AccountOverview from "@/components/guest-account/account-overview";
import ProfileForm from "@/components/guest-account/profile-form";
import PasswordForm from "@/components/guest-account/password-form";
import BookingsList from "@/components/guest-account/bookings-list";
import PaymentsList from "@/components/guest-account/payments-list";
import FavoritesList from "@/components/guest-account/favorites-list";
import {
  ChartBar,
  UserCircle,
  Lock,
  SuitcaseRolling,
  CreditCard,
  Heart,
} from "@phosphor-icons/react";

type Tab = "overview" | "profile" | "security" | "bookings" | "payments" | "favorites";

const tabs: { id: Tab; labelKey: keyof import("@/lib/content").Content["guestAccount"]; icon: React.ReactNode }[] = [
  { id: "overview", labelKey: "overview", icon: <ChartBar size={16} weight="light" aria-hidden /> },
  { id: "profile", labelKey: "profile", icon: <UserCircle size={16} weight="light" aria-hidden /> },
  { id: "security", labelKey: "security", icon: <Lock size={16} weight="light" aria-hidden /> },
  { id: "bookings", labelKey: "myBookings", icon: <SuitcaseRolling size={16} weight="light" aria-hidden /> },
  { id: "payments", labelKey: "payments", icon: <CreditCard size={16} weight="light" aria-hidden /> },
  { id: "favorites", labelKey: "favorites", icon: <Heart size={16} weight="light" aria-hidden /> },
];

function AccountContent() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (session?.user as { role?: string })?.role;
  const tabParam = searchParams.get("tab") as Tab | null;
  const initialTab = tabs.some((tab) => tab.id === tabParam) ? tabParam! : "overview";
  const [active, setActive] = useState<Tab>(initialTab);

  const selectTab = (tab: Tab) => {
    setActive(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/account?${params.toString()}`, { scroll: false });
  };

  if (role !== "GUEST") return <EmptyState />;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:py-16 lg:px-8">
      <div className="mb-8">
        <h1 className="display-sm font-display text-primary">{t.guestAccount.dashboard}</h1>
        <p className="mt-1 text-on-surface-muted">
          {session?.user?.name} · {t.guestAccount.title}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label={t.guestAccount.dashboard}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              id={`account-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`account-panel-${tab.id}`}
              onClick={() => selectTab(tab.id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-gold text-on-surface"
                  : "border-transparent text-on-surface-muted hover:text-gold"
              }`}
            >
              {tab.icon}
              {t.guestAccount[tab.labelKey]}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div id={`account-panel-${active}`} role="tabpanel" aria-labelledby={`account-tab-${active}`} className="grid gap-6">
        {active === "overview" && <AccountOverview />}
        {active === "profile" && <ProfileForm />}
        {active === "security" && <PasswordForm />}
        {active === "bookings" && <BookingsList />}
        {active === "payments" && <PaymentsList />}
        {active === "favorites" && <FavoritesList />}
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-5xl px-5 py-12 md:py-16 lg:px-8" />}>
      <AccountContent />
    </Suspense>
  );
}
