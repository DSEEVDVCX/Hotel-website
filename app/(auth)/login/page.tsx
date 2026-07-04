"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError("Invalid credentials");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">{t.auth.loginTitle}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label={t.auth.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label={t.auth.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? "..." : t.auth.loginBtn}</Button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-text-muted)]">
        {t.auth.noAccount}{" "}
        <a href="/register" className="text-[var(--color-accent)] underline">{t.auth.registerLink}</a>
      </p>
    </main>
  );
}
