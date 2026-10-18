"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bike, CheckCircle2, FileText, Loader2, Mail, MessageSquare, Phone, Power, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/api";

type Approval = "pending" | "approved" | "rejected";
type Audience = "approved" | "online" | "pending" | "all";

interface AdminRider {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  vehicle_type: string;
  vehicle_plate?: string | null;
  status: string;
  approval_status: Approval;
  approval_note?: string | null;
  id_document_url?: string | null;
  total_deliveries?: number;
  rating?: number;
  updated_at?: string;
}

const TABS: { id: Approval | "all"; label: string }[] = [
  { id: "pending", label: "Waiting for review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Not approved" },
  { id: "all", label: "All" },
];

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [tab, setTab] = useState<Approval | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modals
  const [rejecting, setRejecting] = useState<AdminRider | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [messaging, setMessaging] = useState<{ rider: AdminRider | null } | null>(null);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [audience, setAudience] = useState<Audience>("approved");
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setRiders((await apiService.getRidersForAdmin()) as AdminRider[]);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () => ({
      pending: riders.filter((r) => r.approval_status === "pending").length,
      approved: riders.filter((r) => r.approval_status === "approved").length,
      rejected: riders.filter((r) => r.approval_status === "rejected").length,
      all: riders.length,
      online: riders.filter((r) => r.status === "online" || r.status === "busy").length,
    }),
    [riders]
  );
  const visible = tab === "all" ? riders : riders.filter((r) => r.approval_status === tab);

  const act = async (rider: AdminRider, fn: () => Promise<unknown>, done: string) => {
    setBusyId(rider.id);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(done);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const approve = (r: AdminRider) =>
    act(r, () => apiService.reviewRider(r.id, "approve"), `${r.full_name || "Rider"} approved and notified.`);

  const confirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejecting) return;
    const r = rejecting;
    setRejecting(null);
    await act(r, () => apiService.reviewRider(r.id, "reject", rejectNote.trim() || undefined), `${r.full_name || "Rider"} notified that they weren't approved.`);
    setRejectNote("");
  };

  const deactivate = (r: AdminRider) => {
    if (!window.confirm(`Deactivate ${r.full_name || "this rider"}? They will no longer receive jobs.`)) return;
    act(r, () => apiService.deactivateRider(r.id), "Rider deactivated.");
  };

  const openMessage = (rider: AdminRider | null) => {
    setMsgTitle("");
    setMsgBody("");
    setAudience("approved");
    setMessaging({ rider });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messaging || !msgBody.trim()) return;
    setSending(true);
    setError(null);
    try {
      if (messaging.rider) {
        await apiService.messageRider(messaging.rider.id, msgTitle.trim(), msgBody.trim());
        setNotice(`Message sent to ${messaging.rider.full_name || "rider"}.`);
      } else {
        const res = await apiService.broadcastToRiders({ title: msgTitle.trim(), body: msgBody.trim(), audience });
        setNotice(`Message sent to ${res.sent} rider${res.sent === 1 ? "" : "s"}.`);
      }
      setMessaging(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 mt-1">
            {counts.approved} approved · {counts.online} online now · {counts.pending} waiting for review
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => openMessage(null)} leftIcon={<Send className="w-4 h-4" />}>
          Message riders
        </Button>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>}
      {notice && <p role="status" className="text-sm font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3">{notice}</p>}

      <div className="flex gap-2 overflow-x-auto scrollbar-none" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
              tab === t.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
            }`}
          >
            {t.label} <span className="opacity-60">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mt-10" />
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl p-8 text-center">
          {tab === "pending" ? "No riders waiting for review." : "No riders here."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((r) => {
            const online = r.status === "online" || r.status === "busy";
            const busy = busyId === r.id;
            return (
              <li key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] flex items-center justify-center overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" /> : <Bike className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {r.full_name || "Unnamed rider"}
                      {r.approval_status === "approved" && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                          {r.status === "busy" ? "On a delivery" : online ? "Online" : "Offline"}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                      {r.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.email}</span>}
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="flex items-center gap-1 hover:text-[#087F5B]"><Phone className="w-3 h-3" />{r.phone}</a>
                      )}
                      <span className="capitalize">{r.vehicle_type}{r.vehicle_plate ? ` · ${r.vehicle_plate}` : ""}</span>
                      <span>{r.total_deliveries || 0} deliveries</span>
                    </div>
                    {r.approval_status === "rejected" && r.approval_note && (
                      <p className="text-xs text-rose-600 mt-1">Note sent: {r.approval_note}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {r.id_document_url ? (
                    <a
                      href={r.id_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> View ID
                    </a>
                  ) : (
                    <span className="px-3 py-2 text-xs text-slate-400">No ID uploaded</span>
                  )}
                  {r.approval_status !== "approved" && (
                    <button
                      onClick={() => approve(r)}
                      disabled={busy}
                      className="px-3 py-2 rounded-xl bg-[#087F5B] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {r.approval_status !== "rejected" && (
                    <button
                      onClick={() => {
                        setRejectNote("");
                        setRejecting(r);
                      }}
                      disabled={busy}
                      className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> {r.approval_status === "approved" ? "Suspend" : "Reject"}
                    </button>
                  )}
                  <button
                    onClick={() => openMessage(r)}
                    disabled={busy}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                  <button
                    onClick={() => deactivate(r)}
                    disabled={busy}
                    title="Deactivate"
                    aria-label="Deactivate rider"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={!!rejecting} onClose={() => setRejecting(null)} title={rejecting?.approval_status === "approved" ? "Suspend rider" : "Don't approve rider"}>
        <form onSubmit={confirmReject} className="flex flex-col gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {rejecting?.full_name || "The rider"} will be told by email and in the Rider Hub. They can update their details and ask to be reviewed again.
          </p>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="What should they fix? e.g. The ID photo is blurry — please upload a clearer one."
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none"
          />
          <Button type="submit" variant="danger">Send and update status</Button>
        </form>
      </Modal>

      <Modal
        isOpen={!!messaging}
        onClose={() => setMessaging(null)}
        title={messaging?.rider ? `Message ${messaging.rider.full_name || "rider"}` : "Message riders"}
        subtitle="Delivered in the Rider Hub and by email."
      >
        <form onSubmit={sendMessage} className="flex flex-col gap-4">
          {!messaging?.rider && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Send to</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                className="w-full px-4 py-3 bg-[#F8FAF9] dark:bg-slate-800 text-sm outline-none"
              >
                <option value="approved">All approved riders ({counts.approved})</option>
                <option value="online">Riders online now ({counts.online})</option>
                <option value="pending">Riders waiting for review ({counts.pending})</option>
                <option value="all">Everyone ({counts.all})</option>
              </select>
            </div>
          )}
          <Input label="Subject" value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} placeholder="e.g. Rain tonight — ride safe" />
          <textarea
            value={msgBody}
            onChange={(e) => setMsgBody(e.target.value)}
            rows={5}
            required
            placeholder="Write your message"
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none"
            aria-label="Message"
          />
          <Button type="submit" variant="primary" isLoading={sending} disabled={sending || !msgBody.trim()} leftIcon={<Send className="w-4 h-4" />}>
            Send
          </Button>
        </form>
      </Modal>
    </div>
  );
}
