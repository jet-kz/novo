"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, MessageSquare, Upload } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";

/**
  * Shown in the Rider Hub until an admin approves the rider. Lets them upload an ID (driver's
    * licence, NIN slip, voter's card...) and fix vehicle details. Updating after a rejection
      * puts them back in the review queue.
        */
export function RiderOnboardingStatus() {
  const { riderProfile, refreshRider } = usePlatform();
  const rejected = riderProfile.approvalStatus === "rejected";
  const [plate, setPlate] = useState(riderProfile.vehiclePlate || "");
  const [vehicle, setVehicle] = useState(riderProfile.vehicleType || "motorcycle");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadId = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = await apiService.uploadRiderDocument(file);
      await apiService.updateRiderMe({ id_document_path: path });
      await refreshRider();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiService.updateRiderMe({ vehicle_type: vehicle, vehicle_plate: plate.trim() });
      await refreshRider();
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 w-full flex flex-col gap-5">
      <div className={`rounded-3xl p-6 ${rejected ? "bg-rose-950/40" : "bg-slate-900"}`}>
        <div className="flex items-center gap-3">
          {rejected ? <AlertCircle className="w-7 h-7 text-rose-400 shrink-0" /> : <Clock className="w-7 h-7 text-amber-300 shrink-0" />}
          <h1 className="text-xl font-black text-white">
            {rejected ? "Your application needs a fix" : "We're reviewing your application"}
          </h1>
        </div>
        <p className="text-sm text-slate-300 mt-3 leading-relaxed">
          {rejected
            ? "Update the details below and we'll take another look."
            : "Our team checks every rider before their first delivery. Upload a clear photo of your ID to speed things up. We'll email you as soon as you're approved."}
        </p>
        {rejected && riderProfile.approvalNote && (
          <p className="text-sm text-rose-200 mt-3 rounded-xl bg-rose-950/60 p-3">
            <span className="font-bold">Note from our team: </span>
            {riderProfile.approvalNote}
          </p>
        )}
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-300 bg-rose-950/60 rounded-xl p-3">{error}</p>}

      <div className="rounded-3xl bg-slate-900 p-5 flex flex-col gap-3">
        <h2 className="text-sm font-black text-white">ID document</h2>
        <p className="text-xs text-slate-400">Driver&apos;s licence, NIN slip, voter&apos;s card or international passport. Make sure your name and photo are readable.</p>
        <div className="flex items-center gap-3">
          {riderProfile.idDocumentUrl ? (
            <a
              href={riderProfile.idDocumentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4" /> ID uploaded <FileText className="w-4 h-4" />
            </a>
          ) : (
            <span className="text-sm text-slate-400">Not uploaded yet</span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="ml-auto px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {riderProfile.idDocumentUrl ? "Replace" : "Upload photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => uploadId(e.target.files?.[0])} />
        </div>
      </div>

      <form onSubmit={saveDetails} className="rounded-3xl bg-slate-900 p-5 flex flex-col gap-3">
        <h2 className="text-sm font-black text-white">Vehicle</h2>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value as typeof vehicle)}
            className="px-3 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none"
            aria-label="Vehicle type"
          >
            <option value="motorcycle">Motorcycle</option>
            <option value="bicycle">Bicycle</option>
            <option value="car">Car / Van</option>
          </select>
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Plate number"
            aria-label="Plate number"
            className="px-3 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none"
          />
        </div>
        <button type="submit" disabled={saving} className="py-3 rounded-xl bg-slate-800 text-white text-sm font-bold disabled:opacity-60 cursor-pointer">
          {saving ? "Saving..." : saved ? "Saved" : rejected ? "Save and ask for review" : "Save"}
        </button>
      </form>

      <Link href="/rider/messages" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
        <MessageSquare className="w-4 h-4" /> Messages from Novo
      </Link>
    </div>
  );
}
