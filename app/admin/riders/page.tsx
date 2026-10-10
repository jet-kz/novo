"use client";

import React, { useState, useEffect } from "react";
import { usePlatform } from "@/store/PlatformContext";
import { Table, Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { RiderProfile } from "@/types";
import { apiService } from "@/services/api";
import { Bike, ShieldCheck, ShieldAlert, Power, DollarSign, CheckCircle2, UserCheck } from "lucide-react";

export default function AdminRidersPage() {
  const { riderProfile, verifyRider } = usePlatform();
  
  // Seeded mock fleet for admin management preview
  const defaultFleet: RiderProfile[] = [
    {
      id: "rider-1",
      role: "rider",
      email: "tunde.rider@novo.ng",
      name: "Tunde Bakare",
      phone: "+234 803 123 4567",
      vehicleType: "motorcycle",
      vehiclePlate: "LSD-458-XY",
      isOnline: true,
      isVerified: true,
      verificationStatus: "verified",
      totalDeliveries: 142,
      rating: 4.9,
      earningsToday: 18500,
      earningsThisWeek: 94000,
      tipsToday: 2300,
      createdAt: "2026-01-10T00:00:00Z",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "rider-2",
      role: "rider",
      email: "chidi.rider@novo.ng",
      name: "Chidi Okonkwo",
      phone: "+234 802 987 6543",
      vehicleType: "bicycle",
      vehiclePlate: "KJA-892-AB",
      isOnline: true,
      isVerified: true,
      verificationStatus: "verified",
      totalDeliveries: 89,
      rating: 4.8,
      earningsToday: 11200,
      earningsThisWeek: 62000,
      tipsToday: 1200,
      createdAt: "2026-02-15T00:00:00Z",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "rider-3",
      role: "rider",
      email: "emeka.rider@novo.ng",
      name: "Emeka Johnson",
      phone: "+234 809 333 1122",
      vehicleType: "motorcycle",
      vehiclePlate: "FST-102-CD",
      isOnline: false,
      isVerified: false,
      verificationStatus: "pending",
      totalDeliveries: 12,
      rating: 4.5,
      earningsToday: 0,
      earningsThisWeek: 8500,
      tipsToday: 0,
      createdAt: "2026-03-01T00:00:00Z",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
  ];

  const [ridersList, setRidersList] = useState<RiderProfile[]>(defaultFleet);
  const [loading, setLoading] = useState(true);

  const fetchBackendRiders = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRiders();
      if (Array.isArray(data) && data.length > 0) {
        setRidersList(data);
      }
    } catch (e) {
      console.warn("Using default fleet list:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendRiders();
  }, []);

  const handleVerify = async (riderId: string) => {
    verifyRider(riderId);
    setRidersList((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, isVerified: true } : r))
    );
  };

  const handleToggleOnline = (riderId: string) => {
    setRidersList((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, isOnline: !r.isOnline } : r))
    );
  };

  const onlineCount = ridersList.filter((r) => r.isOnline).length;
  const verifiedCount = ridersList.filter((r) => r.isVerified).length;
  const totalDeliveriesCount = ridersList.reduce((sum, r) => sum + r.totalDeliveries, 0);

  const columns: Column<RiderProfile>[] = [
    {
      header: "Rider Partner",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <img
            src={r.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
            alt={r.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
          />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              {r.name}
              {r.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
            </span>
            <span className="text-xs text-slate-400">{r.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Vehicle Details",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{r.vehiclePlate}</span>
          <span className="text-[10px] text-slate-400">{r.vehicleType}</span>
        </div>
      ),
    },
    {
      header: "Status & Rating",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              r.isOnline
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${r.isOnline ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
            {r.isOnline ? "ONLINE" : "OFFLINE"}
          </span>
          <span className="text-xs font-bold text-amber-500">{r.rating} ★</span>
        </div>
      ),
    },
    {
      header: "Deliveries",
      cell: (r) => <span className="text-xs font-bold font-mono">{r.totalDeliveries} Jobs</span>,
    },
    {
      header: "Account State",
      cell: (r) => (
        <StatusBadge status={r.isVerified ? "verified" : "pending"} />
      ),
    },
    {
      header: "Actions",
      cell: (r) => (
        <div className="flex items-center gap-2">
          {!r.isVerified ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleVerify(r.id)}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Verify Rider
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleOnline(r.id)}
            >
              {r.isOnline ? "Set Offline" : "Set Online"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* PAGE TITLE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bike className="w-7 h-7 text-emerald-500" />
            <span>Rider Fleet Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, verify, and dispatch courier partner accounts across the platform.
          </p>
        </div>

        <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl">
          {onlineCount} Online Fleet Active
        </span>
      </div>

      {/* FLEET METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Riders</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{ridersList.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Partners</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{verifiedCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently Online</span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{onlineCount}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Platform Deliveries</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalDeliveriesCount}</span>
        </div>
      </div>

      {/* RIDERS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <Table columns={columns} data={ridersList} keyExtractor={(r) => r.id || "rider-key"} />
      </div>
    </div>
  );
}
