"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function safeCallbackPath(raw: string | null, fallback: string, requiredPrefix?: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (requiredPrefix && !raw.startsWith(requiredPrefix)) return fallback;
  return raw;
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = safeCallbackPath(searchParams.get("callbackUrl"), "/admin", "/admin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("بيانات الدخول غير صحيحة");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;

      // Admin portal: guests must use the buyer login page.
      if (role !== "ADMIN") {
        await signOut({ redirect: false });
        setError(t.auth.wrongPortalGuest);
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="display-sm font-display text-primary">{t.auth.adminLoginTitle}</h1>
        <p className="mt-2 text-sm text-on-surface-muted">{t.auth.adminLoginSubtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t.auth.email} type="text" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <Input label={t.auth.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="w-full">{loading ? "جاري الدخول..." : t.auth.loginBtn}</Button>
      </form>
      <p className="mt-6 text-center text-xs text-on-surface-subtle">
        <Link href="/login" className="link-underline">{t.auth.loginLink}</Link>
      </p>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-12">
      <Suspense fallback={<div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary mx-auto" />}>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
