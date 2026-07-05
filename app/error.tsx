"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-error">
        حدث خطأ · Something went wrong
      </h1>
      <p className="mt-2 text-sm text-on-surface-muted">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-gold px-4 py-2 text-white"
      >
        إعادة المحاولة · Try again
      </button>
    </main>
  );
}
