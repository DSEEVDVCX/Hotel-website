import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-[var(--color-text)]">404</h1>
      <p className="mt-2 text-[var(--color-text-muted)]">
        الصفحة غير موجودة · Page not found
      </p>
      <Link href="/" className="mt-4 text-[var(--color-accent)] underline">
        العودة للرئيسية · Back to home
      </Link>
    </main>
  );
}
