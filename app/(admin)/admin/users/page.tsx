"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { EmptyState } from "@/components/ui/EmptyState";
import { MagnifyingGlass, Users as UsersIcon } from "@phosphor-icons/react";

type UserItem = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  SUSPENDED: "bg-error/10 text-error",
};

const roleStyles: Record<string, string> = {
  GUEST: "bg-primary-tint text-primary",
  ADMIN: "bg-gold/10 text-gold-deep",
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { locale, t } = useLanguage();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const role = (session?.user as { role?: string } | undefined)?.role;

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (role !== "ADMIN") return;
    load();
  }, [role, load]);

  const handleAction = async (userId: string, action: "suspend" | "reinstate") => {
    const confirmMsg = action === "suspend" ? t.admin.confirmSuspend : t.admin.confirmReinstate;
    if (!confirm(confirmMsg)) return;
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  if (role !== "ADMIN") return <EmptyState />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <UsersIcon size={28} weight="light" className="text-gold-deep" aria-hidden />
        <h1 className="text-2xl font-bold text-on-surface font-display">{t.admin.users}</h1>
      </div>

      <div className="mb-6 relative max-w-md">
        <MagnifyingGlass size={18} weight="light" className="absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-subtle" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.admin.searchUsers}
          className="field ps-10"
        />
      </div>

      {loading ? (
        <p className="text-on-surface-muted">...</p>
      ) : filtered.length === 0 ? (
        <EmptyState message={t.admin.noResults} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-on-surface-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t.auth.name}</th>
                <th className="px-4 py-3 text-start font-medium">{t.admin.email}</th>
                <th className="px-4 py-3 text-start font-medium">{t.admin.role}</th>
                <th className="px-4 py-3 text-start font-medium">{t.admin.status}</th>
                <th className="px-4 py-3 text-start font-medium">{t.admin.joined}</th>
                <th className="px-4 py-3 text-end font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="bg-surface-raised transition-colors hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-on-surface hover:text-gold-deep">
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-on-surface-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[u.role] || "bg-surface-muted text-on-surface-muted"}`}>
                      {u.role === "ADMIN" ? t.admin.adminRole : t.admin.guest}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[u.status] || "bg-surface-muted text-on-surface-muted"}`}>
                      {u.status === "ACTIVE" ? t.admin.active : t.admin.suspended}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {new Date(u.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/users/${u.id}`} className="text-xs font-semibold text-primary hover:text-primary-hover">
                        {t.guestAccount.bookingDetails}
                      </Link>
                      {u.status === "ACTIVE" && u.role !== "ADMIN" && (
                        <button onClick={() => handleAction(u.id, "suspend")} className="text-xs text-error hover:underline">
                          {t.admin.suspend}
                        </button>
                      )}
                      {u.status === "SUSPENDED" && (
                        <button onClick={() => handleAction(u.id, "reinstate")} className="text-xs text-success hover:underline">
                          {t.admin.reinstate}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
