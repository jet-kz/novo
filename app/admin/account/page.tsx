"use client";

import React, { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AdminUserRow } from "@/types";
import { useMyRoles } from "@/components/admin/useMyRoles";

export default function AdminAccountPage() {
  const { currentUser } = usePlatform();
  const { isSuperAdmin } = useMyRoles();

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <ProfileCard name={currentUser.name} phone={currentUser.phone} email={currentUser.email} superAdmin={isSuperAdmin} />
      <PasswordCard />
      <AdminsCard canManage={isSuperAdmin} myId={currentUser.id} />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">{icon}{title}</h2>
      {children}
    </section>
  );
}

function Feedback({ error, notice }: { error: string | null; notice: string | null }) {
  if (error) return <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>;
  if (notice) return <p role="status" className="text-sm font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3">{notice}</p>;
  return null;
}

function ProfileCard({ name, phone, email, superAdmin }: { name: string; phone: string; email: string; superAdmin: boolean }) {
  const [form, setForm] = useState({ full_name: name || "", phone: phone || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => setForm({ full_name: name || "", phone: phone || "" }), [name, phone]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiService.updateUserProfile(form);
      setNotice("Profile saved.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Your profile" icon={<ShieldCheck className="w-4 h-4 text-[#087F5B]" />}>
      <p className="text-sm text-slate-500">
        Signed in as <strong className="text-slate-900 dark:text-white">{email}</strong> · {superAdmin ? "Super admin" : "Admin"}
      </p>
      <Feedback error={error} notice={notice} />
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" />
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" size="sm" isLoading={busy} disabled={busy}>Save profile</Button>
        </div>
      </form>
    </Section>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (form.next.length < 8) return setError("Use at least 8 characters.");
    if (form.next !== form.confirm) return setError("The new passwords don't match.");
    setBusy(true);
    try {
      await apiService.changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setNotice("Password changed. We've emailed you a confirmation.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Change password" icon={<KeyRound className="w-4 h-4 text-[#087F5B]" />}>
      <p className="text-sm text-slate-500">Admin accounts can move money and approve riders. Use a long password you don&apos;t use anywhere else.</p>
      <Feedback error={error} notice={notice} />
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required />
        <Input label="New password" type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        <div className="sm:col-span-3">
          <Button type="submit" variant="primary" size="sm" isLoading={busy} disabled={busy}>Change password</Button>
        </div>
      </form>
    </Section>
  );
}

function AdminsCard({ canManage, myId }: { canManage: boolean; myId: string }) {
  const [admins, setAdmins] = useState<AdminUserRow[] | null>(null);
  const [form, setForm] = useState({ email: "", full_name: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setAdmins((await apiService.adminUsers({ role: "admin", limit: 100 })).items);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fn();
      setNotice(res?.message || "Done.");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Admins" icon={<UserPlus className="w-4 h-4 text-[#087F5B]" />}>
      <Feedback error={error} notice={notice} />
      {!admins ? (
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {admins.map((a) => (
            <li key={a.id} className="py-2.5 flex items-center gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{a.name || a.email}{a.id === myId ? " (you)" : ""}</p>
                <p className="text-xs text-slate-500 truncate">{a.email} · {a.roles.includes("super_admin") ? "Super admin" : "Admin"}{a.is_active ? "" : " · suspended"}</p>
              </div>
              {canManage && a.id !== myId && (
                <button
                  onClick={() => window.confirm(`Remove admin access for ${a.email}?`) && run(() => apiService.setUserAdmin(a.id, false))}
                  disabled={busy}
                  className="text-xs font-bold text-rose-600 cursor-pointer disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => apiService.inviteAdmin(form.email, form.full_name)).then(() => setForm({ email: "", full_name: "" }));
          }}
          className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800"
        >
          <p className="text-sm text-slate-500">Add an admin by email. If they don&apos;t have a Novo account yet, one is created and they get an email code to set their own password.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Button type="submit" variant="primary" size="sm" isLoading={busy} disabled={busy}>Add admin</Button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-500">Only a super admin can add or remove admins.</p>
      )}
    </Section>
  );
}
