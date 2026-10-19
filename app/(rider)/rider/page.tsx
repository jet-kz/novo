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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-6">
      <EnableAlertsCard
        storageKey="rider"
        tone="dark"
        title="Get job alerts"
        body="We'll ping you when a new delivery is ready near you, even with the app closed. First to accept gets it."
      />
      {riderProfile.isOnline && gps.problem && (
        <p role="status" className="rounded-2xl bg-amber-500/15 text-amber-200 text-sm font-semibold p-3">{gps.problem}</p>
      )}

      {/* RIDER PROFILE HEADER */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={riderProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
              alt={riderProfile.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
            />
            {riderProfile.isVerified && (
              <ShieldCheck className="w-5 h-5 text-emerald-400 absolute -bottom-1 -right-1 bg-slate-900 rounded-full" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{riderProfile.name || "Rider"}</h2>
              <span className="text-xs font-bold bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {riderProfile.vehiclePlate || riderProfile.vehicleType}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {riderProfile.totalDeliveries} Deliveries Completed • {riderProfile.rating || 5.0} ★ Rating
            </p>
          </div>
        </div>

        {/* ONLINE TOGGLE SWITCH */}
        <button
          onClick={handleToggleOnline}
          disabled={busy}
          className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-lg active:scale-95 ${
            riderProfile.isOnline
              ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
              : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{riderProfile.isOnline ? "ONLINE - Ready for Jobs" : "OFFLINE - Go Online"}</span>
        </button>
      </div>

      {(actionError || ordersError) && (
        <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-3">
          {actionError || ordersError}
        </p>
      )}

      {/* QUICK RIDER STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Earnings</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100">
            ₦{(riderProfile.earningsToday ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tips Collected</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ₦{(riderProfile.tipsToday ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Job</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100">
            {activeOrder ? "1 In Progress" : "None"}
          </span>
        </div>
      </div>

      {/* ACTIVE DELIVERY TASK & INTERACTIVE MAP */}
      {activeOrder && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Dispatch Task #{activeOrder.id}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Deliver to {activeOrder.customerName}
              </h3>
            </div>
            <StatusBadge status={activeOrder.status} />
          </div>

          {/* EMBEDDED INTERACTIVE ROUTE MAP */}
          <div className="flex flex-col gap-2">
            {route.minutes != null && (
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                ~{route.minutes} min{route.km != null ? ` · ${route.km} km` : ""} to the {route.heading === "customer" ? "customer" : "store"}
              </p>
            )}
            <LiveOrderMap order={activeOrder} riderPosition={gps.position} route={route.path} forRider className="h-72" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* STEP 1: PICKUP MERCHANT */}
            <div className={`p-4 rounded-2xl flex flex-col gap-2 transition-all ${
              activeOrder.status === "rider_assigned"
                ? "bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-300/70 dark:ring-amber-700/70"
                : "bg-slate-50 dark:bg-slate-800/50 opacity-80"
            }`}>
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm">
                <Store className="w-4 h-4 text-amber-500" />
                <span>1. Pickup Store Location</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{activeOrder.storeName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{activeOrder.storeAddress || "Merchant Store"}</p>
              <p className="mt-2 text-xs bg-white dark:bg-slate-900 p-2 rounded-xl font-bold text-amber-600">
                Ask the store for the 4-digit pickup code.
              </p>
            </div>

            {/* STEP 2: DROP OFF CUSTOMER */}
            <div className={`p-4 rounded-2xl flex flex-col gap-2 transition-all ${
              activeOrder.status === "picked_up"
                ? "bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-300/70 dark:ring-emerald-700/70"
                : "bg-slate-50 dark:bg-slate-800/50 opacity-80"
            }`}>
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-sm">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>2. Customer Dropoff Location</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{activeOrder.customerName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{activeOrder.deliveryAddress}</p>
              <p className="mt-1 text-xs bg-white dark:bg-slate-900 p-2 rounded-xl font-bold text-emerald-700 dark:text-emerald-300">
                Hand over, then ask the customer for their 4-digit delivery code.
              </p>
              {activeOrder.customerPhone && (
                <a href={`tel:${activeOrder.customerPhone}`} className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Customer ({activeOrder.customerPhone})</span>
                </a>
              )}
            </div>
          </div>

          {/* DISPATCH ACTION FOOTER */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Delivery Earnings Payout</span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                ₦{earningsFor(activeOrder).toLocaleString()}
              </p>
            </div>

            {activeOrder.status === "rider_assigned" && (
              <Button
                variant="primary"
                onClick={() => setShowVerifyModal("pickup")}
                leftIcon={<Navigation className="w-4 h-4" />}
              >
                Arrived at Store & Pickup
              </Button>
            )}

            {activeOrder.status === "picked_up" && (
              <Button
                variant="primary"
                onClick={() => setShowVerifyModal("delivery")}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Hand over & enter code
              </Button>
            )}
          </div>
        </div>
      )}

      {/* AVAILABLE JOBS DISPATCH FEED */}
      {!activeOrder && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Available Delivery Offers ({availableJobs.length})
            </h3>
            <span className="text-xs text-slate-400">Auto-refreshing dispatch queue</span>
          </div>

          {availableJobs.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
              <Bike className="w-10 h-10 text-slate-300 dark:text-slate-700 animate-pulse" />
              <span>
                {riderProfile.isOnline
                  ? "Waiting for new merchant dispatch orders in your zone..."
                  : "You are offline. Click 'ONLINE' button above to receive job offers."}
              </span>
            </div>
          ) : (
            availableJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                      Pickup: {job.storeName}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                      Ready for Pickup
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Deliver to: {job.deliveryAddress}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Earnings: ₦{earningsFor(job).toLocaleString()}
                  </span>
                </div>
                <Button variant="primary" size="sm" disabled={busy} onClick={() => handleAccept(job.id)}>
                  Accept Delivery
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* POPUP 1: BROADCAST JOB OFFER MODAL */}
      <Modal isOpen={jobOfferModal && !!offeredJob} onClose={dismissOffer} title="New Delivery Offer!">
        <div className="flex flex-col gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto text-2xl animate-bounce">
            🛵
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase">Estimated Earnings</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
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
              Accept Job
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
        title="Confirm Store Pickup"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Enter the 4-digit pickup code shown on the store receipt or merchant screen to confirm package receipt.
          </p>

          <input
            type="text"
            placeholder="4-digit code"
            inputMode="numeric"
            maxLength={4}
            aria-label="Pickup code"
            value={pickupCodeInput}
            onChange={(e) => setPickupCodeInput(e.target.value)}
            className="w-full text-center text-xl font-mono tracking-widest font-black py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
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
