"use client";

import { Suspense, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthNav } from "@/components/auth/AuthNav";
import { PropertySwitcher } from "@/components/admin/manage/property-switcher";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.replace("/admin/login");
  }, [status, session, router]);

  if (status === "loading") {
    return <div className="min-h-screen bg-surface" />;
  }

  if (!session) {
    return <div className="min-h-screen bg-surface" />;
  }

  if (role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-surface">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <AuthNav role="ADMIN" />
      <div className="border-b border-border bg-surface-raised px-5 py-3">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<div className="h-9" />}>
            <PropertySwitcher />
          </Suspense>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</div>
    </div>
  );
}
