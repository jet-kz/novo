"use client";

import React, { useState } from "react";
import { usePlatform } from "@/store/PlatformContext";
import { Table, Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Store } from "@/types";
import { apiService } from "@/services/api";
import { Star, ShieldCheck, Sparkles, Edit3 } from "lucide-react";
import { useCatalog } from "@/components/shared/useCatalog";

export default function AdminStoresPage() {
  const { stores: storesList, approveStore, updateStore, toggleStoreStatus } = usePlatform();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [customCommission, setCustomCommission] = useState("");
  const { categories: platformCategories } = useCatalog();
  const [storeCategory, setStoreCategory] = useState("restaurant");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || "That action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (storeId: string) => run(storeId, () => approveStore(storeId));
  const handleToggleOpen = (storeId: string) => run(storeId, () => toggleStoreStatus(storeId));

  const handleSaveStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setSaving(true);
    setError(null);
    try {
      if (storeCategory !== selectedStore.category) {
        await updateStore(selectedStore.id, { category: storeCategory as Store["category"] });
      }
      if (customCommission.trim() !== "") {
        const rate = Number(customCommission);
        if (!(rate >= 0 && rate <= 100)) throw new Error("Commission must be between 0 and 100%");
        const res = await apiService.saveCommissionRule({
          name: `${selectedStore.name} override`,
          rule_type: "PERCENTAGE",
          value: rate,
          merchant_id: selectedStore.merchantId,
          is_active: true,
        });
        if (res?.detail) throw new Error(typeof res.detail === "string" ? res.detail : "Could not save commission");
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Could not save store configuration.");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Store>[] = [
    { header: "Store Name", accessorKey: "name" },
    { header: "Category", accessorKey: "category" },
    { header: "Phone", accessorKey: "phone" },
    {
      header: "Accepting Orders",
      cell: (s) => (
        <button
          onClick={() => handleToggleOpen(s.id)}
          disabled={busyId === s.id}
          className={`px-3 py-1 text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
            s.isOpening !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{s.isOpening !== false ? "Open" : "Closed"}</span>
        </button>
      ),
    },
    { header: "Rating", cell: (s) => <span>{s.rating || 5.0} ★</span> },
    { header: "Status", cell: (s) => <StatusBadge status={s.isVerified ? "active" : "pending"} /> },
    {
      header: "Actions",
      cell: (s) => (
        <div className="flex items-center gap-2">
          {!s.isVerified && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleApprove(s.id)}
              disabled={busyId === s.id}
            >
              Approve Store
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedStore(s);
              setStoreCategory(s.category || "restaurant");
              setCustomCommission("");
              setIsEditModalOpen(true);
            }}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Config
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Store Approvals &amp; Configuration
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Approve registered stores, open or close them for orders, and set commission overrides.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500">
          {storesList.length} Stores Total
        </span>
      </div>

      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">
          {error}
        </p>
      )}

      <Table columns={columns} data={storesList} keyExtractor={(s) => s.id} />

      {/* EDIT STORE CONFIG MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Configure ${selectedStore?.name}`}
      >
        <form onSubmit={handleSaveStoreConfig} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Primary Store Category
            </label>
            <select
              value={storeCategory}
              onChange={(e) => setStoreCategory(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              {platformCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
            </select>
          </div>

          <Input
            label="Merchant Commission Override (%)"
            type="number"
            value={customCommission}
            onChange={(e) => setCustomCommission(e.target.value)}
            placeholder="Leave blank to keep the platform default"
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={saving}>
            Save Store Configuration
          </Button>
        </form>
      </Modal>
    </div>
  );
}
