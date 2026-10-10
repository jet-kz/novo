"use client";

import React, { useState, useEffect } from "react";
import { Navigation, MapPin, Store, Bike, Compass, Maximize2 } from "lucide-react";

interface DeliveryMapProps {
  storeName: string;
  storeAddress: string;
  customerName: string;
  customerAddress: string;
  riderName?: string;
  status: "rider_assigned" | "picked_up" | "delivered" | string;
  className?: string;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  storeName,
  storeAddress,
  customerName,
  customerAddress,
  riderName = "Rider",
  status,
  className = "",
}) => {
  // Simulated progress along the route (0 to 100%)
  const [progress, setProgress] = useState(status === "picked_up" ? 50 : 15);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (status === "delivered") return 100;
        if (prev >= 90) return 20;
        return prev + 2;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [status]);

  // Calculate coordinates for animated SVG rider marker along a smooth bezier curve
  // Curve from (80, 180) Store -> (400, 70) Dropoff
  const startX = 80;
  const startY = 170;
  const endX = 420;
  const endY = 70;
  const controlX = 250;
  const controlY = 200;

  const t = progress / 100;
  const riderX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
  const riderY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    storeAddress
  )}&destination=${encodeURIComponent(customerAddress)}&travelmode=bicycling`;

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl text-white ${className}`}
    >
      {/* MAP HEADER OVERLAY */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/60 flex items-center gap-2.5 shadow-lg pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black tracking-wide text-slate-100">
            {status === "picked_up" ? "En Route to Customer" : "Navigating to Pickup Store"}
          </span>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-2xl flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 pointer-events-auto"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Open GPS</span>
        </a>
      </div>

      {/* SVG INTERACTIVE VECTOR MAP GRAPHIC */}
      <div className="relative w-full h-64 sm:h-72 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center">
        {/* MAP GRID LINES / ROADS SIMULATION */}
        <svg className="absolute inset-0 w-full h-full opacity-30" width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* ROAD NETWORK LINES */}
        <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 500 240" preserveAspectRatio="none">
          {/* Secondary road background lines */}
          <path d="M 10 120 Q 200 220 490 120" fill="none" stroke="#1e293b" strokeWidth="12" />
          <path d="M 100 10 Q 250 150 380 230" fill="none" stroke="#1e293b" strokeWidth="8" />

          {/* ACTIVE DISPATCH ROUTE POLYLINE */}
          <path
            d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
            fill="none"
            stroke="#059669"
            strokeWidth="5"
            strokeDasharray="8 6"
            className="animate-pulse"
          />

          {/* COMPLETED PATH PORTION */}
          <path
            d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${t < 0.5 ? riderX : controlX} ${
              t < 0.5 ? riderY : controlY
            }`}
            fill="none"
            stroke="#10b981"
            strokeWidth="5"
          />
        </svg>

        {/* MARKER 1: STORE PICKUP (LEFT/BOTTOM) */}
        <div
          className="absolute z-10 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(startX / 500) * 100}%`, top: `${(startY / 240) * 100}%` }}
        >
          <div className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap mb-1 flex items-center gap-1 border border-amber-300">
            <Store className="w-3 h-3" />
            <span>{storeName}</span>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-lg backdrop-blur-xs animate-bounce">
            <Store className="w-5 h-5" />
          </div>
        </div>

        {/* MARKER 2: RIDER LIVE POSITION (MOVING) */}
        <div
          className="absolute z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
          style={{ left: `${(riderX / 500) * 100}%`, top: `${(riderY / 240) * 100}%` }}
        >
          <div className="bg-emerald-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-xl whitespace-nowrap mb-1 flex items-center gap-1 border border-emerald-300">
            <Bike className="w-3 h-3" />
            <span>{riderName} (Live GPS)</span>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 border-2 border-white text-white flex items-center justify-center shadow-2xl">
              <Bike className="w-6 h-6 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
            </span>
          </div>
        </div>

        {/* MARKER 3: CUSTOMER DROPOFF (RIGHT/TOP) */}
        <div
          className="absolute z-10 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(endX / 500) * 100}%`, top: `${(endY / 240) * 100}%` }}
        >
          <div className="bg-sky-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap mb-1 flex items-center gap-1 border border-sky-300">
            <MapPin className="w-3 h-3" />
            <span>{customerName}</span>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-sky-500/20 border-2 border-sky-400 text-sky-400 flex items-center justify-center shadow-lg backdrop-blur-xs">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* MAP FOOTER ADDRESS QUICK BAR */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate pr-2">
          <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">
            <strong className="text-white">Route:</strong> {storeAddress} → {customerAddress}
          </span>
        </div>
        <div className="bg-slate-800 text-emerald-400 font-mono font-bold px-2.5 py-1 rounded-xl shrink-0">
          2.4 km • 12 min
        </div>
      </div>
    </div>
  );
};
