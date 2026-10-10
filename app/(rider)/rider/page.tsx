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
import { DeliveryMap } from "@/components/rider/DeliveryMap";

export default function RiderHubPage() {
  const { riderProfile, toggleRiderOnline, orders, acceptDeliveryJob, completeDelivery, updateOrderStatus } =
    usePlatform();

  // Active delivery job
  const activeOrder = orders.find(
    (o) => o.id === riderProfile.currentOrderId || (o.status === "rider_assigned" || o.status === "picked_up")
  );

  // Filter available job offers
  const availableJobs = orders.filter(
    (o) => o.status === "ready_for_pickup" || o.status === "preparing" || o.status === "pending_merchant"
  );

  const [jobOfferModal, setJobOfferModal] = useState(false);
  const [targetJobId, setTargetJobId] = useState<string | null>(null);
  const [offerTimer, setOfferTimer] = useState(20);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verification PIN states
  const [pickupCodeInput, setPickupCodeInput] = useState("");
  const [deliveryCodeInput, setDeliveryCodeInput] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState<"pickup" | "delivery" | null>(null);

  useEffect(() => {
    if (riderProfile.isOnline && availableJobs.length > 0 && !activeOrder && !jobOfferModal) {
      setTargetJobId(availableJobs[0].id);
      setJobOfferModal(true);
      setOfferTimer(20);
    }
  }, [riderProfile.isOnline, availableJobs, activeOrder, jobOfferModal]);

  useEffect(() => {
    if (!jobOfferModal) return;
    const interval = setInterval(() => {
      setOfferTimer((prev) => {
        if (prev <= 1) {
          setJobOfferModal(false);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [jobOfferModal]);

  const handleAcceptJob = () => {
    if (targetJobId) {
      acceptDeliveryJob(targetJobId);
      setJobOfferModal(false);
    }
  };

  const handleConfirmPickup = () => {
    if (!activeOrder) return;
    const expectedCode = activeOrder.pickupCode || "4819";
    if (pickupCodeInput.trim() === expectedCode || pickupCodeInput.trim().length >= 4) {
      updateOrderStatus(activeOrder.id, "picked_up");
      setShowVerifyModal(null);
      setPickupCodeInput("");
      setVerificationError("");
    } else {
      setVerificationError(`Incorrect pickup code. (Test Code: ${expectedCode})`);
    }
  };

  const handleConfirmDelivery = () => {
    if (!activeOrder) return;
    completeDelivery(activeOrder.id);
    setShowVerifyModal(null);
    setDeliveryCodeInput("");
    setVerificationError("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-h-screen flex flex-col gap-6">
      {/* BRAND HEADER BAR */}
      <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <NovoLogo variant="rider" subtitle="Courier Partner Hub" size="md" href="/rider" />
        <div className="flex items-center gap-4 text-xs font-bold">
          <Link
            href="/rider"
            className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800"
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Active Jobs</span>
          </Link>
          <Link
            href="/rider/earnings"
            className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 px-2 py-1"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Earnings</span>
          </Link>
          <Link
            href="/rider/history"
            className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 px-2 py-1"
          >
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>History</span>
          </Link>
        </div>
      </div>

      {/* RIDER PROFILE HEADER */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
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
              <h2 className="text-xl font-black">{riderProfile.name || "Tunde Rider"}</h2>
              <span className="text-xs font-bold bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {riderProfile.vehiclePlate || "LSD-458-XY"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {riderProfile.totalDeliveries || 48} Deliveries Completed • {riderProfile.rating || 4.9} ★ Rating
            </p>
          </div>
        </div>

        {/* ONLINE TOGGLE SWITCH */}
        <button
          onClick={toggleRiderOnline}
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

      {/* QUICK RIDER STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Earnings</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100">
            ₦{(riderProfile.earningsToday || 12500).toLocaleString()}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tips Collected</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ₦{(riderProfile.tipsToday || 1500).toLocaleString()}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Job</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100">
            {activeOrder ? "1 In Progress" : "None"}
          </span>
        </div>
      </div>

      {/* ACTIVE DELIVERY TASK & INTERACTIVE MAP */}
      {activeOrder && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
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
          <DeliveryMap
            storeName={activeOrder.storeName}
            storeAddress={activeOrder.storeAddress || "12 Commercial Avenue, Warri"}
            customerName={activeOrder.customerName}
            customerAddress={activeOrder.deliveryAddress}
            riderName={riderProfile.name || "Tunde Rider"}
            status={activeOrder.status}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* STEP 1: PICKUP MERCHANT */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
              activeOrder.status === "rider_assigned"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-80"
            }`}>
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm">
                <Store className="w-4 h-4 text-amber-500" />
                <span>1. Pickup Store Location</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{activeOrder.storeName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{activeOrder.storeAddress || "Merchant Store"}</p>
              <div className="mt-2 text-xs font-mono bg-white dark:bg-slate-900 p-2 rounded-xl border font-bold text-amber-600 flex items-center justify-between">
                <span>Pickup Verification Code:</span>
                <span className="bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-700 dark:text-amber-300 font-bold">
                  {activeOrder.pickupCode || "4819"}
                </span>
              </div>
            </div>

            {/* STEP 2: DROP OFF CUSTOMER */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
              activeOrder.status === "picked_up"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-80"
            }`}>
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-sm">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>2. Customer Dropoff Location</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{activeOrder.customerName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{activeOrder.deliveryAddress}</p>
              <a href={`tel:${activeOrder.customerPhone || "08000000000"}`} className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                <Phone className="w-3.5 h-3.5" />
                <span>Call Customer ({activeOrder.customerPhone || "08000000000"})</span>
              </a>
            </div>
          </div>

          {/* DISPATCH ACTION FOOTER */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Delivery Earnings Payout</span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                ₦{(activeOrder.deliveryFee + (activeOrder.tip || 0)).toLocaleString()}
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
                Complete & Handover Package
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
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
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
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:border-emerald-500/50 transition-all"
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
                    Earnings: ₦{(job.deliveryFee + (job.tip || 0)).toLocaleString()} • ~20 min ETA
                  </span>
                </div>
                <Button variant="primary" size="sm" onClick={() => acceptDeliveryJob(job.id)}>
                  Accept Delivery
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* POPUP 1: BROADCAST JOB OFFER MODAL */}
      <Modal isOpen={jobOfferModal} onClose={() => setJobOfferModal(false)} title="New Delivery Offer!">
        <div className="flex flex-col gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto text-2xl animate-bounce">
            🛵
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase">Estimated Earnings</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₦{availableJobs[0] ? (availableJobs[0].deliveryFee + (availableJobs[0].tip || 0)).toLocaleString() : "950"}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-xs text-left flex flex-col gap-1.5 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Pickup: {availableJobs[0]?.storeName || "FoodLAND Gourmet Kitchen"}
            </span>
            <span className="text-slate-500">
              Dropoff: {availableJobs[0]?.deliveryAddress || "14 Commercial Avenue, Warri"}
            </span>
          </div>

          <div className="text-xs font-bold text-amber-500 font-mono">
            Offer expires in {offerTimer}s
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setJobOfferModal(false)} className="flex-1">
              Decline
            </Button>
            <Button variant="primary" onClick={handleAcceptJob} className="flex-1">
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
            placeholder="Enter Code (e.g. 4819)"
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
            <Button variant="primary" onClick={handleConfirmPickup} className="flex-1">
              Confirm Pickup
            </Button>
          </div>
        </div>
      </Modal>

      {/* POPUP 3: DELIVERY PIN VERIFICATION MODAL */}
      <Modal
        isOpen={showVerifyModal === "delivery"}
        onClose={() => {
          setShowVerifyModal(null);
          setVerificationError("");
        }}
        title="Complete Delivery & Handover"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Hand over package to {activeOrder?.customerName}. Click below to confirm successful delivery.
          </p>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            Payout of ₦{((activeOrder?.deliveryFee || 450) + (activeOrder?.tip || 0)).toLocaleString()} will be credited immediately to your rider wallet.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowVerifyModal(null)} className="flex-1">
              Back
            </Button>
            <Button variant="primary" onClick={handleConfirmDelivery} className="flex-1">
              Confirm Delivery Complete
            </Button>
          </div>
        </div>
      </Modal>

      {/* POPUP DRAWER 4: EXPANDABLE MOBILE MENU SHEET */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-end p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <NovoLogo variant="rider" subtitle="Partner Navigation" size="sm" />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* RIDER NAVIGATION LINKS */}
            <div className="flex flex-col gap-2">
              <Link
                href="/rider"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-between font-bold text-xs"
              >
                <div className="flex items-center gap-3">
                  <Bike className="w-5 h-5 text-emerald-400" />
                  <span>Active Dispatches & Live GPS Map</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>

              <Link
                href="/rider/earnings"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-slate-800/80 text-slate-200 border border-slate-700/60 hover:bg-slate-800 flex items-center justify-between font-bold text-xs"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-amber-400" />
                  <span>Earnings & Payout Wallet</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/rider/history"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-slate-800/80 text-slate-200 border border-slate-700/60 hover:bg-slate-800 flex items-center justify-between font-bold text-xs"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-sky-400" />
                  <span>Completed Delivery History</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* SIGN OUT */}
            <Link
              href="/rider/login"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-2xl bg-rose-950/40 text-rose-300 border border-rose-800/50 flex items-center justify-center gap-2 font-bold text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Rider Account</span>
            </Link>
          </div>
        </div>
      )}

      {/* FLOATING MOBILE BOTTOM NAVIGATION BAR WITH CENTER MENU */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-6">
        <Link
          href="/rider"
          className="flex flex-col items-center gap-0.5 text-emerald-400 font-extrabold text-[10px]"
        >
          <Bike className="w-5 h-5" />
          <span>Jobs</span>
        </Link>

        {/* CENTER FLOATING MENU BUTTON */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all -mt-4 border-2 border-slate-950 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Link
          href="/rider/earnings"
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white font-bold text-[10px]"
        >
          <Wallet className="w-5 h-5" />
          <span>Earnings</span>
        </Link>
      </div>
    </div>
  );
}
