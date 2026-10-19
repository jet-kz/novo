"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bike,
  Power,
  ShieldCheck,
  MapPin,
  Store,
  Phone,
  CheckCircle2,
  DollarSign,
  Clock,
  ArrowRight,
  Navigation,
  KeyRound,
  FileCheck,
  TrendingUp,
  Menu,
  X,
  Wallet,
  LogOut,
  Compass,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { LiveOrderMap } from "@/components/map/LiveOrderMap";
import { useRiderGps } from "@/components/rider/useRiderGps";
import { useOrderRoute } from "@/components/tracking/useOrderRoute";
import { RiderOnboardingStatus } from "@/components/rider/RiderOnboardingStatus";
import { EnableAlertsCard } from "@/components/notifications/EnableAlertsCard";
import type { Order } from "@/types";

export default function RiderHubPage() {
  const { riderProfile, toggleRiderOnline, orders, ordersError, currentUser, acceptDeliveryJob, confirmPickup, completeDelivery, reportDeliveryProblem } =
    usePlatform();

  const me = riderProfile.id || currentUser.id;
  // The backend scopes /orders for riders: jobs ready for pickup with no rider, plus jobs assigned to me.
  const gps = useRiderGps(riderProfile.isOnline);
  const activeOrder = orders.find((o) => o.riderId === me && (o.status === "rider_assigned" || o.status === "picked_up"));
  const route = useOrderRoute(activeOrder, gps.position);
  const availableJobs = riderProfile.isOnline ? orders.filter((o) => o.status === "ready_for_pickup" && !o.riderId) : [];
  const earningsFor = (o?: Order) => (o ? o.riderEarnings ?? Math.round(o.deliveryFee * 0.85 + (o.tip || 0)) : 0);

  const [jobOfferModal, setJobOfferModal] = useState(false);
  const [targetJobId, setTargetJobId] = useState<string | null>(null);
  const [dismissedJobIds, setDismissedJobIds] = useState<string[]>([]);
  const [offerTimer, setOfferTimer] = useState(20);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [pickupCodeInput, setPickupCodeInput] = useState("");
  const [deliveryCodeInput, setDeliveryCodeInput] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState<"pickup" | "delivery" | null>(null);
  const [problemMode, setProblemMode] = useState(false);
  const [problemReason, setProblemReason] = useState("");

  const offeredJob = availableJobs.find((j) => j.id === targetJobId);

  useEffect(() => {
    const next = availableJobs.find((j) => !dismissedJobIds.includes(j.id));
    if (riderProfile.isOnline && next && !activeOrder && !jobOfferModal) {
      setTargetJobId(next.id);
      setJobOfferModal(true);
      setOfferTimer(20);
    }
  }, [riderProfile.isOnline, availableJobs, activeOrder, jobOfferModal, dismissedJobIds]);

  const dismissOffer = () => {
    if (targetJobId) setDismissedJobIds((prev) => [...prev, targetJobId]);
    setJobOfferModal(false);
  };

  useEffect(() => {
    if (!jobOfferModal) return;
    const interval = setInterval(() => {
      setOfferTimer((prev) => {
        if (prev <= 1) {
          dismissOffer();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobOfferModal]);

  const run = async (fn: () => Promise<unknown>, onError?: (msg: string) => void) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      return true;
    } catch (e: any) {
      const msg = e?.message || "Something went wrong. Please try again.";
      (onError || setActionError)(msg);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleToggleOnline = () => run(toggleRiderOnline);

  const handleAccept = async (jobId: string) => {
    setJobOfferModal(false);
    const ok = await run(() => acceptDeliveryJob(jobId));
    if (!ok) setDismissedJobIds((prev) => [...prev, jobId]);
  };

  const handleAcceptJob = () => {
    if (targetJobId) handleAccept(targetJobId);
  };

  const handleConfirmPickup = async () => {
    if (!activeOrder) return;
    const code = pickupCodeInput.trim();
    if (!/^\d{4}$/.test(code)) {
      setVerificationError("Enter the 4-digit code from the store.");
      return;
    }
    const ok = await run(() => confirmPickup(activeOrder.id, code), setVerificationError);
    if (ok) {
      setShowVerifyModal(null);
      setPickupCodeInput("");
      setVerificationError("");
    }
  };

  const closeVerify = () => {
    setShowVerifyModal(null);
    setVerificationError("");
    setProblemMode(false);
    setProblemReason("");
  };

  const handleConfirmDelivery = async () => {
    if (!activeOrder) return;
    const code = deliveryCodeInput.replace(/\D/g, "");
    if (code.length !== 4) {
      setVerificationError("Ask the customer for the 4-digit code on their order screen.");
      return;
    }
    const ok = await run(() => completeDelivery(activeOrder.id, code), setVerificationError);
    if (ok) {
      setDeliveryCodeInput("");
      closeVerify();
    }
  };

  const handleReportProblem = async () => {
    if (!activeOrder) return;
    if (problemReason.trim().length < 5) {
      setVerificationError("Tell us what happened so support can follow up.");
      return;
    }
    const ok = await run(() => reportDeliveryProblem(activeOrder.id, problemReason.trim()), setVerificationError);
    if (ok) closeVerify();
  };

  // New riders wait for an admin to approve them before they can go online.
  if (riderProfile.approvalStatus && riderProfile.approvalStatus !== "approved") {
    return <RiderOnboardingStatus />;
  }

  const firstName = (riderProfile.name || "").split(" ")[0];
  const headline = activeOrder
    ? activeOrder.status === "picked_up"
      ? `Deliver to ${activeOrder.customerName || "the customer"}`
      : `Pick up from ${activeOrder.storeName || "the store"}`
    : !riderProfile.isOnline
      ? "You're offline"
      : availableJobs.length
        ? `${availableJobs.length} job${availableJobs.length === 1 ? "" : "s"} near you`
        : "Waiting for jobs";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 w-full flex flex-col gap-10">
      <EnableAlertsCard
        storageKey="rider"
        title="Get job alerts"
        body="We'll ping you when a new delivery is ready near you, even with the app closed. First to accept gets it."
      />

      {/* Greeting */}
      <div>
        <p className="text-sm text-slate-500">{firstName ? `Hi ${firstName}` : "Hi"} · {riderProfile.totalDeliveries || 0} deliveries done</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">{headline}</h1>
        {riderProfile.isOnline && gps.problem && (
          <p role="status" className="mt-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-sm px-4 py-3">{gps.problem}</p>
        )}
      </div>

      {(actionError || ordersError) && (
        <p role="alert" className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl px-4 py-3">
          {actionError || ordersError}
        </p>
      )}

      {/* Today: plain numbers, no boxes */}
      <section className="grid grid-cols-3 gap-6">
        <Stat label="Earned today" value={`₦${(riderProfile.earningsToday ?? 0).toLocaleString()}`} />
        <Stat label="Tips today" value={`₦${(riderProfile.tipsToday ?? 0).toLocaleString()}`} />
        <Stat label="This week" value={`₦${(riderProfile.earningsThisWeek ?? 0).toLocaleString()}`} />
      </section>

      {/* Current job */}
      {activeOrder && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Current job</h2>
              <p className="text-sm text-slate-500">
                #{activeOrder.id.slice(-6).toUpperCase()} · you earn ₦{earningsFor(activeOrder).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={activeOrder.status} />
          </div>

          {route.minutes != null && (
            <p className="text-sm font-semibold">
              ~{route.minutes} min{route.km != null ? ` · ${route.km} km` : ""} to the {route.heading === "customer" ? "customer" : "store"}
            </p>
          )}
          <LiveOrderMap order={activeOrder} riderPosition={gps.position} route={route.path} forRider className="h-72 rounded-[28px]" />

          <ol className="flex flex-col gap-2">
            <Stop
              n={1}
              active={activeOrder.status === "rider_assigned"}
              done={activeOrder.status === "picked_up"}
              icon={<Store className="w-4 h-4" />}
              title={activeOrder.storeName || "Store"}
              detail={activeOrder.storeAddress || ""}
              hint="Ask the store for the 4-digit pickup code."
            />
            <Stop
              n={2}
              active={activeOrder.status === "picked_up"}
              icon={<MapPin className="w-4 h-4" />}
              title={activeOrder.customerName || "Customer"}
              detail={activeOrder.deliveryAddress}
              hint="Hand over, then ask for their 4-digit delivery code."
              action={
                activeOrder.customerPhone ? (
                  <a href={`tel:${activeOrder.customerPhone}`} className="h-9 px-4 rounded-full bg-white dark:bg-slate-800 text-[#087F5B] text-[13px] font-semibold flex items-center gap-1.5 shrink-0">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                ) : null
              }
            />
          </ol>

          {activeOrder.status === "rider_assigned" && (
            <button onClick={() => setShowVerifyModal("pickup")} className="h-12 rounded-2xl bg-[#087F5B] text-white text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer">
              <Navigation className="w-4 h-4" /> I&apos;m at the store · enter pickup code
            </button>
          )}
          {activeOrder.status === "picked_up" && (
            <button onClick={() => setShowVerifyModal("delivery")} className="h-12 rounded-2xl bg-[#087F5B] text-white text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer">
              <CheckCircle2 className="w-4 h-4" /> Hand over · enter delivery code
            </button>
          )}
        </section>
      )}

      {/* Jobs feed */}
      {!activeOrder && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Available jobs</h2>
            <p className="text-sm text-slate-500">Updates on its own. First to accept gets the job.</p>
          </div>

          {!riderProfile.isOnline ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <span className="w-14 h-14 rounded-[20px] bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <Power className="w-6 h-6 text-slate-400" />
              </span>
              <p className="text-sm text-slate-500 max-w-xs">Go online to start getting delivery offers near you.</p>
              <button onClick={handleToggleOnline} disabled={busy} className="h-11 px-6 rounded-2xl bg-[#087F5B] text-white text-sm font-semibold cursor-pointer disabled:opacity-60">
                Go online
              </button>
            </div>
          ) : availableJobs.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <span className="w-14 h-14 rounded-[20px] bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <Bike className="w-6 h-6 text-[#087F5B] animate-pulse" />
              </span>
              <p className="text-sm text-slate-500 max-w-xs">No jobs right now. We&apos;ll alert you the moment one is ready.</p>
            </div>
          ) : (
            <ul className="flex flex-col -mx-3">
              {availableJobs.map((job) => (
                <li key={job.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <span className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold truncate">{job.storeName}</p>
                    <p className="text-xs text-slate-500 truncate">To {job.deliveryAddress}</p>
                  </div>
                  <span className="text-[15px] font-bold text-[#087F5B] shrink-0">₦{earningsFor(job).toLocaleString()}</span>
                  <button
                    disabled={busy}
                    onClick={() => handleAccept(job.id)}
                    className="h-9 px-4 rounded-full bg-[#087F5B] text-white text-[13px] font-semibold shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* POPUP 1: BROADCAST JOB OFFER MODAL */}
      <Modal isOpen={jobOfferModal && !!offeredJob} onClose={dismissOffer} title="New delivery">
        <div className="flex flex-col gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto text-2xl animate-bounce">
            🛵
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-slate-500">You earn</span>
            <span className="text-3xl font-bold text-[#087F5B] dark:text-emerald-400">
              ₦{earningsFor(offeredJob).toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-xs text-left flex flex-col gap-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Pickup: {offeredJob?.storeName}
            </span>
            <span className="text-slate-500">
              Dropoff: {offeredJob?.deliveryAddress}
            </span>
          </div>

          <div className="text-xs font-bold text-amber-500 font-mono">
            Offer expires in {offerTimer}s
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={dismissOffer} className="flex-1">
              Decline
            </Button>
            <Button variant="primary" onClick={handleAcceptJob} disabled={busy} className="flex-1">
              Accept
            </Button>
          </div>
        </div>
      </Modal>

      {/* POPUP 2: PICKUP CODE VERIFICATION MODAL */}
      <Modal
        isOpen={showVerifyModal === "pickup"}
        onClose={() => {
          setShowVerifyModal(null);
          setVerificationError("");
        }}
        title="Confirm pickup"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Type the 4-digit code the store gives you.
          </p>

          <input
            type="text"
            placeholder="4-digit code"
            inputMode="numeric"
            maxLength={4}
            aria-label="Pickup code"
            value={pickupCodeInput}
            onChange={(e) => setPickupCodeInput(e.target.value)}
            className="w-full text-center text-xl font-mono tracking-widest font-black py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
          />

          {verificationError && (
            <p className="text-xs font-bold text-rose-500">{verificationError}</p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowVerifyModal(null)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmPickup} disabled={busy} className="flex-1">
              Confirm Pickup
            </Button>
          </div>
        </div>
      </Modal>

      {/* POPUP 3: DELIVERY CODE (or report a problem) */}
      <Modal isOpen={showVerifyModal === "delivery"} onClose={closeVerify} title={problemMode ? "Can't complete this delivery" : "Confirm delivery"}>
        {!problemMode ? (
          <div className="flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Hand the order to {activeOrder?.customerName || "the customer"}, then type the 4-digit code from their order screen, text or email.
            </p>
            <input
              type="text"
              placeholder="• • • •"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              aria-label="Delivery code"
              value={deliveryCodeInput}
              onChange={(e) => {
                setDeliveryCodeInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                setVerificationError("");
              }}
              className="w-full text-center text-2xl font-mono tracking-[0.5em] font-black py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            {verificationError && <p role="alert" className="text-xs font-bold text-rose-500">{verificationError}</p>}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 font-bold">
              ₦{earningsFor(activeOrder).toLocaleString()} is added to your earnings once the code checks out.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={closeVerify} className="flex-1">
                Back
              </Button>
              <Button variant="primary" onClick={handleConfirmDelivery} disabled={busy || deliveryCodeInput.length !== 4} className="flex-1">
                Complete delivery
              </Button>
            </div>
            <button
              type="button"
              onClick={() => {
                setProblemMode(true);
                setVerificationError("");
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              Customer unreachable or refused the order?
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Only use this if you&apos;ve tried calling and waited. Support is alerted and will contact you about returning the order.
            </p>
            <textarea
              value={problemReason}
              onChange={(e) => setProblemReason(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="e.g. Called 3 times, no answer. Waited 10 minutes at the gate."
              className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 text-sm outline-none focus:ring-2 focus:ring-rose-400/50 text-slate-900 dark:text-white"
            />
            {verificationError && <p role="alert" className="text-xs font-bold text-rose-500">{verificationError}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setProblemMode(false)} className="flex-1">
                Back
              </Button>
              <Button variant="danger" onClick={handleReportProblem} disabled={busy} className="flex-1">
                Report problem
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-slate-500 truncate">{label}</p>
      <p className="mt-1 text-xl sm:text-3xl font-bold tracking-tight truncate">{value}</p>
    </div>
  );
}

function Stop({
  n,
  active,
  done,
  icon,
  title,
  detail,
  hint,
  action,
}: {
  n: number;
  active: boolean;
  done?: boolean;
  icon: React.ReactNode;
  title: string;
  detail: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <li className={`flex items-start gap-3 p-4 rounded-3xl transition-colors ${active ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-slate-50 dark:bg-slate-900/60"} ${done ? "opacity-60" : ""}`}>
      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-[#087F5B] text-white" : "bg-white dark:bg-slate-800 text-slate-500"}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">Stop {n}</p>
        <p className="text-[15px] font-semibold truncate">{title}</p>
        {detail && <p className="text-sm text-slate-500">{detail}</p>}
        {active && <p className="text-sm font-medium text-[#087F5B] dark:text-emerald-300 mt-1">{hint}</p>}
      </div>
      {action}
    </li>
  );
}
