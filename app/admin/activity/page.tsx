"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiService } from "@/services/api";

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");
const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;

/** Plain-English description of an audit entry. */
function describe(a: any): { text: string; href?: string } {
  const d = a.details || {};
  const id = a.entity_id;
  switch (a.action) {
    case "order.status": return { text: `changed order ${id} to ${String(d.to || "").toLowerCase().replace(/_/g, " ")}${d.reason ? ` (“${d.reason}”)` : ""}`, href: `/admin/orders?view=all&order=${id}` };
    case "order.refund": return { text: `recorded a ${naira(d.amount)} refund on order ${id} (ref ${d.reference})`, href: `/admin/orders?view=all&order=${id}` };
    case "settlement.send": return { text: `settled ${naira(d.amount)} to a ${a.entity_type} (${d.status})`, href: "/admin/settlements" };
    case "rider.approved": return { text: "approved a rider", href: "/admin/riders" };
    case "rider.rejected": return { text: `didn't approve a rider${d.note ? ` (“${d.note}”)` : ""}`, href: "/admin/riders" };
    case "rider.message": return { text: `messaged a rider${d.title ? `: “${d.title}”` : ""}`, href: "/admin/riders" };
    case "rider.broadcast": return { text: `messaged ${d.sent ?? ""} riders (${id})${d.title ? `: “${d.title}”` : ""}`, href: "/admin/riders" };
    case "rider.deactivate": return { text: "deactivated a rider", href: "/admin/riders" };
    case "store.approve": return { text: `approved store ${d.name || ""}`, href: "/admin/stores" };
    case "store.unapprove": return { text: `withdrew approval for store ${d.name || ""}`, href: "/admin/stores" };
    case "user.suspend": return { text: `suspended an account${d.reason ? ` (“${d.reason}”)` : ""}`, href: "/admin/users" };
    case "user.reactivate": return { text: "reactivated an account", href: "/admin/users" };
    case "user.password_reset_sent": return { text: "sent a password reset code", href: "/admin/users" };
    case "admin.grant": return { text: "gave someone admin access", href: "/admin/account" };
    case "admin.revoke": return { text: "removed someone's admin access", href: "/admin/account" };
    case "merchant.removed": return { text: `removed a merchant${d.reason ? ` (${d.reason})` : ""}`, href: "/admin/stores" };
    default:
      if (a.action.startsWith("merchant.")) return { text: `set merchant ${d.name || ""} to ${a.action.split(".")[1]}`, href: "/admin/stores" };
      return { text: `${a.action} on ${a.entity_type} ${id}` };
  }
}

export default function AdminActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const res = await apiService.adminActivity(offset);
      setItems((prev) => (offset ? [...prev, ...res.items] : res.items));
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl">
      <p className="text-sm text-slate-500">Every action taken in the admin console, newest first: who did it and when.</p>
      {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 rounded-xl p-3">{error}</p>}
      <div className="bg-white dark:bg-slate-900 rounded-2xl">
        {loading && items.length === 0 ? (
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto my-12" />
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((a) => {
              const { text, href } = describe(a);
              const body = (
                <>
                  <span className="font-semibold text-slate-900 dark:text-white">{a.actor_email || a.actor}</span>{" "}
                  <span className="text-slate-600 dark:text-slate-300">{text}</span>
                  <span className="block text-xs text-slate-400 mt-0.5">{when(a.at)}</span>
                </>
              );
              return (
                <li key={a.id} className="px-4 py-3 text-sm">
                  {href ? <Link href={href} className="block hover:opacity-80">{body}</Link> : body}
                </li>
              );
            })}
          </ul>
        )}
        {items.length < total && (
          <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => load(items.length)} disabled={loading} className="text-sm font-bold text-[#087F5B] cursor-pointer">{loading ? "Loading…" : "Show more"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
