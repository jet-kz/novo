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
    <div className="max-w-xl mx-auto px-4 pt-6 sm:pt-10 w-full flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${rejected ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
            {rejected ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            {rejected ? "Your application needs a fix" : "We're reviewing your application"}
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          {rejected
            ? "Update the details below and we'll take another look."
            : "Our team checks every rider before their first delivery. Upload a clear photo of your ID to speed things up. We'll email you as soon as you're approved."}
        </p>
        {rejected && riderProfile.approvalNote && (
          <p className="text-sm text-rose-800 mt-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 px-4 py-3">
            <span className="font-bold">Note from our team: </span>
            {riderProfile.approvalNote}
          </p>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 rounded-2xl px-4 py-3">{error}</p>}

      <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 p-5 flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">ID document</h2>
        <p className="text-sm text-slate-500">Driver&apos;s licence, NIN slip, voter&apos;s card or international passport. Make sure your name and photo are readable.</p>
        <div className="flex items-center gap-3">
          {riderProfile.idDocumentUrl ? (
            <a
              href={riderProfile.idDocumentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-[#087F5B]"
            >
              <CheckCircle2 className="w-4 h-4" /> ID uploaded <FileText className="w-4 h-4" />
            </a>
          ) : (
            <span className="text-sm text-slate-500">Not uploaded yet</span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="ml-auto h-10 px-4 rounded-full bg-[#087F5B] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {riderProfile.idDocumentUrl ? "Replace" : "Upload photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => uploadId(e.target.files?.[0])} />
        </div>
      </div>

      <form onSubmit={saveDetails} className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 p-5 flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">Vehicle</h2>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value as typeof vehicle)}
            className="h-12 px-3 rounded-2xl bg-white dark:bg-slate-800 text-sm outline-none cursor-pointer"
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
            className="h-12 px-3.5 rounded-2xl bg-white dark:bg-slate-800 text-sm outline-none"
          />
        </div>
        <button type="submit" disabled={saving} className="h-12 rounded-2xl bg-[#087F5B] text-white text-sm font-semibold disabled:opacity-60 cursor-pointer">
          {saving ? "Saving..." : saved ? "Saved" : rejected ? "Save and ask for review" : "Save"}
        </button>
      </form>

      <Link href="/rider/messages" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <MessageSquare className="w-4 h-4" /> Messages from Novo
      </Link>
    </div>
  );
}
