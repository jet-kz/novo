"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Trash2, CheckCircle2, Building, Home, Briefcase, Navigation, Sparkles } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";

interface SavedAddress {
  id: string;
  title?: string;
  address: string;
  city?: string;
  state?: string;
  is_default?: boolean;
}

export default function CustomerAddressesPage() {
  const router = useRouter();
  const { currentUser, setUserLocation } = usePlatform();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New address form state
  const [title, setTitle] = useState("Home");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("Lagos");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load addresses from backend
  useEffect(() => {
    async function loadAddresses() {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        const res = await apiService.getAddresses(token || undefined);
        if (Array.isArray(res) && res.length > 0) {
          setAddresses(res);
        } else {
          // Fallback to primary address if present
          setAddresses([
            {
              id: "addr-1",
              title: "Home",
              address: currentUser?.address || "14 Commercial Avenue, Sabo Yaba, Lagos",
              city: "Lagos",
              is_default: true,
            },
          ]);
        }
      } catch (e) {
        console.warn("Could not load addresses from API:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAddresses();
  }, [currentUser]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetAddress.trim()) return;
    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const created = await apiService.createAddress(
        {
          title,
          address: streetAddress,
          city,
          is_default: isDefault || addresses.length === 0,
        },
        token || undefined
      );

      const newAddr: SavedAddress = created.id
        ? created
        : {
            id: `addr-${Date.now()}`,
            title,
            address: streetAddress,
            city,
            is_default: isDefault || addresses.length === 0,
          };

      setAddresses((prev) => (isDefault ? [newAddr, ...prev.map((a) => ({ ...a, is_default: false }))] : [...prev, newAddr]));
      setShowAddModal(false);
      setStreetAddress("");
    } catch (err) {
      console.error("Error adding address:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (addr: SavedAddress) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      await apiService.setDefaultAddress(addr.id, token || undefined);
    } catch (e) {}

    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        is_default: a.id === addr.id,
      }))
    );
    setUserLocation(addr.address);
  };

  const handleDelete = async (addressId: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      await apiService.deleteAddress(addressId, token || undefined);
    } catch (e) {}

    setAddresses((prev) => prev.filter((a) => a.id !== addressId));
  };

  const getIcon = (tag?: string) => {
    const lower = (tag || "").toLowerCase();
    if (lower.includes("work") || lower.includes("office")) return <Briefcase className="w-4 h-4 text-[#008A4C]" />;
    if (lower.includes("other") || lower.includes("apt")) return <Building className="w-4 h-4 text-[#008A4C]" />;
    return <Home className="w-4 h-4 text-[#008A4C]" />;
  };

  return (
    <div className="w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-24 font-sans">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white cursor-pointer hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-black text-[#101714] dark:text-white">Delivery Addresses</h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#008A4C] hover:bg-[#006B3C] text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-[#66736D] dark:text-slate-400">
            Loading saved addresses...
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-[#66736D] dark:text-slate-400 flex flex-col items-center gap-2">
            <MapPin className="w-10 h-10 text-slate-300" />
            <span className="text-sm font-black text-slate-900 dark:text-white">No Saved Addresses</span>
            <p className="max-w-xs text-xs">Add your home or office address for 1-click checkout.</p>
          </div>
        ) : (
          /* FLAT BORDERLESS LIST LAYOUT WITH BOTTOM DIVIDERS (HERO UI STYLE) */
          <div className="flex flex-col bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="py-4 px-3 flex items-start justify-between border-b border-[#E3EAE6]/70 dark:border-slate-800/70 last:border-b-0 hover:bg-[#F7FAF8] dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(addr.title)}
                  </div>

                  <div className="flex flex-col min-w-0 gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#101714] dark:text-white">
                        {addr.title || "Delivery Location"}
                      </span>
                      {addr.is_default && (
                        <span className="px-2 py-0.5 rounded-full bg-[#E8F7EF] text-[#008A4C] text-[10px] font-black uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#66736D] dark:text-slate-300 font-medium leading-relaxed truncate">
                      {addr.address}
                    </p>
                    {addr.city && (
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{addr.city}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      className="text-[11px] font-bold text-[#008A4C] hover:underline cursor-pointer"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD ADDRESS MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black text-[#101714] dark:text-white">Add Delivery Address</h3>

            <form onSubmit={handleAddAddress} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#66736D]">Label / Title</label>
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTitle(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        title === tag
                          ? "bg-[#008A4C] text-white"
                          : "bg-[#F7FAF8] dark:bg-slate-800 text-[#66736D] dark:text-slate-400 border border-[#E3EAE6]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#66736D]">Street Address</label>
                <textarea
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Street name, house/building number, landmark..."
                  className="w-full h-20 p-3 rounded-xl bg-[#F7FAF8] dark:bg-slate-800 text-xs font-semibold border border-[#E3EAE6] dark:border-slate-700 outline-none text-[#101714] dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#66736D]">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="p-3 rounded-xl bg-[#F7FAF8] dark:bg-slate-800 text-xs font-semibold border border-[#E3EAE6] dark:border-slate-700 outline-none text-[#101714] dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-[#101714] dark:text-white cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-[#008A4C] focus:ring-[#008A4C]"
                />
                <span>Set as default delivery address</span>
              </label>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-[#E3EAE6] text-xs font-bold text-[#66736D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white text-xs font-black cursor-pointer shadow-md"
                >
                  {submitting ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
