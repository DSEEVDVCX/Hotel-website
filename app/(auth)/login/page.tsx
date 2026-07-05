"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "";

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
    } else {
      // Fetch session to determine role-based redirect
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;

        // Buyer portal: admins must use the admin login page.
        if (role === "ADMIN") {
          await signOut({ redirect: false });
          setError(t.auth.wrongPortalAdmin);
          setLoading(false);
          return;
        }

        router.push(callbackUrl || "/account");
      } catch {
        router.push("/");
      }
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="display-sm font-display text-primary">{t.auth.loginTitle}</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t.auth.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label={t.auth.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="w-full">{loading ? "..." : t.auth.loginBtn}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-on-surface-muted">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="link-underline font-semibold text-primary-hover">{t.auth.registerLink}</Link>
      </p>
      <p className="mt-3 text-center text-xs text-on-surface-subtle">
        <Link href="/admin/login" className="link-underline">{t.auth.adminPortalLink}</Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-12">
      <Suspense fallback={<div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary mx-auto" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
