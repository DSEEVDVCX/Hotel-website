"use client";

import { useLanguage } from "@/app/providers";
import { AuthNav } from "@/components/auth/AuthNav";
import { useSession } from "next-auth/react";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role as "GUEST" | undefined;
  return (
    <>
      {role === "GUEST" && <AuthNav role="GUEST" />}
      {children}
    </>
  );
}
