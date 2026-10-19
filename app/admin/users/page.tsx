"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, Search, ShieldCheck } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AdminUserRow } from "@/types";
import { useMyRoles } from "@/components/admin/useMyRoles";

const ROLE_FILTERS: [string, string][] = [["", "Everyone"], ["customer", "Customers"], ["merchant", "Merchants"], ["rider", "Riders"], ["admin", "Admins"]];
const PAGE = 50;
const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Never");

const roleLabel = (roles: string[]) =>
  roles.includes("super_admin") ? "Super admin" : roles.includes("admin") ? "Admin" : roles.includes("merchant_owner") ? "Merchant" : roles.includes("rider") ? "Rider" : "Customer";

export default function AdminUsersPage() {
  const { currentUser } = usePlatform();
  const [role, setRole] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const res = await apiService.adminUsers({ q: query, role, status: statusFilter, limit: PAGE, offset });
      setRows((prev) => (offset ? [...prev, ...res.items] : res.items));
      setTotal(res.total);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, role, statusFilter]);

  useEffect(() => {
    load(0);
  }, [load]);
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const refreshSelected = async (id: string) => {
    await load(0);
    const res = await apiService.adminUsers({ q: query, role, status: statusFilter, limit: PAGE });
    setSelected(res.items.find((u) => u.id === id) || null);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
          {ROLE_FILTERS.map(([id, label]) => (
            <button
              key={id || "all"}
              onClick={() => setRole(id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                role === id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Account status"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none"
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email or phone"
            aria-label="Search users"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>}
      {notice && <p role="status" className="text-sm font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3">{notice}</p>}

      <p className="text-xs text-slate-500">{total} account{total === 1 ? "" : "s"}</p>
      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {loading && rows.length === 0 ? (
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto my-12" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">No accounts match.</p>
        ) : (
          <ul className="">
            {rows.map((u) => (
              <li key={u.id}>
                <button onClick={() => setSelected(u)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <span className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] font-black text-sm flex items-center justify-center shrink-0">
                    {(u.name || u.email || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      {u.name || u.email}
                      {u.roles.some((r) => r === "admin" || r === "super_admin") && <ShieldCheck className="w-3.5 h-3.5 text-[#087F5B]" />}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-600 dark:text-slate-300 w-24">{roleLabel(u.roles)}</span>
                  <span className="hidden md:inline text-xs text-slate-500 w-20 text-right">{u.orders} orders</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${u.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"}`}>
                    {u.is_active ? "Active" : "Suspended"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {rows.length < total && (
          <div className="p-3 text-center border-slate-100 dark:border-slate-800">
            <button onClick={() => load(rows.length)} disabled={loading} className="text-sm font-bold text-[#087F5B] cursor-pointer">
              {loading ? "Loading…" : `Show more (${total - rows.length} left)`}
            </button>
          </div>
        )}
      </div>

      {selected && (
        <UserDrawer
          user={selected}
          isSelf={selected.id === currentUser.id}
          onClose={() => setSelected(null)}
          onDone={async (message) => {
            setNotice(message);
            await refreshSelected(selected.id);
          }}
        />
      )}
    </div>
  );
}

function UserDrawer({ user, isSelf, onClose, onDone }: { user: AdminUserRow; isSelf: boolean; onClose: () => void; onDone: (msg: string) => Promise<void> }) {
  const { isSuperAdmin } = useMyRoles();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const isAdmin = user.roles.some((r) => r === "admin" || r === "super_admin");
  // The backend enforces super-admin for admin changes; this only hides the button.
  const canManageAdmins = isSuperAdmin;

  const act = async (fn: () => Promise<any>, message: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      await onDone(res?.message || message);
      setConfirmSuspend(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={user.name || user.email} subtitle={roleLabel(user.roles)}>
      <div className="flex flex-col gap-4 text-sm">
        {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>}
        <dl className="grid grid-cols-2 gap-3">
          <Field label="Email" value={<span className="flex items-center gap-1">{user.email}{user.email_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#087F5B]" aria-label="Verified" />}</span>} />
          <Field label="Phone" value={user.phone ? <a href={`tel:${user.phone}`} className="text-[#087F5B]">{user.phone}</a> : "—"} />
          <Field label="Joined" value={date(user.created_at)} />
          <Field label="Last sign-in" value={date(user.last_sign_in_at)} />
          <Field label="Orders placed" value={String(user.orders)} />
          <Field label="Status" value={user.is_active ? "Active" : "Suspended"} />
        </dl>

        {isSelf ? (
          <p className="text-xs text-slate-500">This is your account. Manage it from “My account & admins”.</p>
        ) : (
          <div className="flex flex-col gap-2 pt-2 border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => act(() => apiService.sendUserPasswordReset(user.id), "Reset code sent")}>
              Email a password reset code
            </Button>
            {canManageAdmins && (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => act(() => apiService.setUserAdmin(user.id, !isAdmin), isAdmin ? "Admin access removed" : "Admin access granted")}>
                {isAdmin ? "Remove admin access" : "Make admin"}
              </Button>
            )}
            {user.is_active ? (
              confirmSuspend ? (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 flex flex-col gap-2">
                  <p className="text-xs text-rose-800 dark:text-rose-200">They&apos;ll be signed out and can&apos;t sign in until reactivated.</p>
                  <Input label="Reason (internal)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Repeated fake orders" />
                  <div className="flex gap-2">
                    <Button variant="danger" size="sm" disabled={busy} onClick={() => act(() => apiService.suspendUser(user.id, reason.trim() || undefined), "Account suspended")}>Suspend account</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmSuspend(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" size="sm" disabled={busy} onClick={() => setConfirmSuspend(true)}>Suspend account</Button>
              )
            ) : (
              <Button variant="primary" size="sm" disabled={busy} onClick={() => act(() => apiService.reactivateUser(user.id), "Account reactivated")}>Reactivate account</Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-slate-900 dark:text-white mt-0.5 break-words">{value}</dd>
    </div>
  );
}
