"use client";

import { useEffect, useState } from "react";
import { 
  Percent, 
  Truck, 
  Settings, 
  Tag, 
  Plus, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Pencil,
  X
} from "lucide-react";
import { api } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";

export default function AdminPricingPage() {
  const { stores } = usePlatform();
  const [activeTab, setActiveTab] = useState<"commission" | "delivery" | "service" | "promotions">("commission");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // States
  const [commissions, setCommissions] = useState<any[]>([]);
  const [deliveryRules, setDeliveryRules] = useState<any[]>([]);
  const [serviceRules, setServiceRules] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);

  // Edit Modal State
  const [editingModal, setEditingModal] = useState<{
    isOpen: boolean;
    type: "commission" | "delivery" | "service" | "promotion" | null;
    data: any;
  }>({
    isOpen: false,
    type: null,
    data: null,
  });

  // Form States
  const [newCommission, setNewCommission] = useState({
    name: "Default Commission",
    value: 10,
    flat_fee: 0,
    merchant_id: "",
    min_order_amount: 0
  });

  const [deliveryForm, setDeliveryForm] = useState({
    name: "Standard Delivery Pricing",
    base_fee: 500,
    per_km_fee: 150,
    minimum_fee: 500,
    maximum_fee: 3000,
    surge_multiplier: 1.0,
    zone_name: "Lagos Mainland"
  });

  const [serviceFeeForm, setServiceFeeForm] = useState({
    name: "Standard Service Fee",
    fee_type: "PERCENTAGE",
    value: 2.0,
    minimum_fee: 100,
    maximum_fee: 1000
  });

  const [promoForm, setPromoForm] = useState({
    code: "",
    name: "",
    description: "",
    promo_type: "PERCENTAGE",
    discount_value: 10,
    min_order_amount: 5000,
    max_discount_amount: 2000,
    funding_source: "PLATFORM",
    per_user_limit: 1
  });

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token") || undefined;
      const [comms, delivs, servs, promos] = await Promise.all([
        api.getCommissionRules(token),
        api.getDeliveryRules(token),
        api.getServiceFeeRules(token),
        api.getPromotions(token)
      ]);

      setCommissions(comms || []);
      setDeliveryRules(delivs || []);
      setServiceRules(servs || []);
      setPromotions(promos || []);

      if (delivs && delivs.length > 0) {
        setDeliveryForm({
          name: delivs[0].name || "Standard Delivery Pricing",
          base_fee: delivs[0].base_fee || 500,
          per_km_fee: delivs[0].per_km_fee || 150,
          minimum_fee: delivs[0].minimum_fee || 500,
          maximum_fee: delivs[0].maximum_fee || 3000,
          surge_multiplier: delivs[0].surge_multiplier || 1.0,
          zone_name: delivs[0].zone_name || "Lagos Mainland"
        });
      }

      if (servs && servs.length > 0) {
        setServiceFeeForm({
          name: servs[0].name || "Standard Service Fee",
          fee_type: servs[0].fee_type || "PERCENTAGE",
          value: servs[0].value || 2.0,
          minimum_fee: servs[0].minimum_fee || 100,
          maximum_fee: servs[0].maximum_fee || 1000
        });
      }
    } catch (e: any) {
      console.error("Failed to load pricing data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommission = async (dataToSave = newCommission) => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("access_token") || undefined;
      await api.saveCommissionRule({
        name: dataToSave.merchant_id ? `Merchant ${dataToSave.merchant_id.slice(0, 6)} Commission` : "Default Platform Commission",
        rule_type: "PERCENTAGE",
        value: Number(dataToSave.value),
        flat_fee: Number(dataToSave.flat_fee),
        merchant_id: dataToSave.merchant_id || null,
        min_order_amount: Number(dataToSave.min_order_amount),
        is_active: true
      }, token);

      setMessage({ text: "Commission rule saved successfully!", type: "success" });
      setEditingModal({ isOpen: false, type: null, data: null });
      loadPricingData();
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save commission rule", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDelivery = async (dataToSave = deliveryForm) => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("access_token") || undefined;
      await api.saveDeliveryRule({
        name: dataToSave.name,
        base_fee: Number(dataToSave.base_fee),
        per_km_fee: Number(dataToSave.per_km_fee),
        minimum_fee: Number(dataToSave.minimum_fee),
        maximum_fee: Number(dataToSave.maximum_fee),
        surge_multiplier: Number(dataToSave.surge_multiplier),
        zone_name: dataToSave.zone_name,
        is_active: true
      }, token);

      setMessage({ text: "Delivery pricing rules updated successfully!", type: "success" });
      setEditingModal({ isOpen: false, type: null, data: null });
      loadPricingData();
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save delivery rule", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveServiceFee = async (dataToSave = serviceFeeForm) => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("access_token") || undefined;
      await api.saveServiceFeeRule({
        name: dataToSave.name,
        fee_type: dataToSave.fee_type,
        value: Number(dataToSave.value),
        minimum_fee: Number(dataToSave.minimum_fee),
        maximum_fee: Number(dataToSave.maximum_fee),
        is_active: true
      }, token);

      setMessage({ text: "Service fee rules updated successfully!", type: "success" });
      setEditingModal({ isOpen: false, type: null, data: null });
      loadPricingData();
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save service fee rule", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePromo = async (dataToSave = promoForm) => {
    if (!dataToSave.code || !dataToSave.name) {
      setMessage({ text: "Please provide a valid code and name for the promotion.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("access_token") || undefined;
      await api.createPromotion({
        code: dataToSave.code.toUpperCase().trim(),
        name: dataToSave.name,
        description: dataToSave.description,
        promo_type: dataToSave.promo_type,
        discount_value: Number(dataToSave.discount_value),
        min_order_amount: Number(dataToSave.min_order_amount),
        max_discount_amount: Number(dataToSave.max_discount_amount),
        funding_source: dataToSave.funding_source,
        per_user_limit: Number(dataToSave.per_user_limit),
        is_active: true
      }, token);

      setMessage({ text: `Promotion '${dataToSave.code}' saved successfully!`, type: "success" });
      setEditingModal({ isOpen: false, type: null, data: null });
      setPromoForm({
        code: "",
        name: "",
        description: "",
        promo_type: "PERCENTAGE",
        discount_value: 10,
        min_order_amount: 5000,
        max_discount_amount: 2000,
        funding_source: "PLATFORM",
        per_user_limit: 1
      });
      loadPricingData();
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to save promotion campaign", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (type: "commission" | "delivery" | "service" | "promotion", item: any) => {
    setEditingModal({
      isOpen: true,
      type,
      data: { ...item }
    });
  };

  return (
    <div className="space-y-6 font-sans text-gray-900 dark:text-gray-100">
      {/* Merchant suggestions for the "Merchant ID" fields: type a store name, get its merchant. */}
      <datalist id="pricing-merchants">
        {stores.filter((st) => st.merchantId).map((st) => (
          <option key={st.id} value={st.merchantId}>{st.name}</option>
        ))}
      </datalist>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure platform commission rates, dynamic delivery pricing, service fees, and promotion campaigns.
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("commission")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap cursor-pointer ${
            activeTab === "commission"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Percent className="w-4 h-4" />
          Commission Rules
        </button>

        <button
          onClick={() => setActiveTab("delivery")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap cursor-pointer ${
            activeTab === "delivery"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Truck className="w-4 h-4" />
          Delivery Pricing
        </button>

        <button
          onClick={() => setActiveTab("service")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap cursor-pointer ${
            activeTab === "service"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Settings className="w-4 h-4" />
          Service Fees
        </button>

        <button
          onClick={() => setActiveTab("promotions")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap cursor-pointer ${
            activeTab === "promotions"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Tag className="w-4 h-4" />
          Promotions & Discounts
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading pricing configuration...</div>
      ) : (
        <div>
          {/* 1. COMMISSION TAB - FLAT BORDERLESS CARDS */}
          {activeTab === "commission" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Add New Commission Rule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Commission Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={newCommission.value}
                        onChange={(e) => setNewCommission({ ...newCommission, value: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-3 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                        placeholder="10"
                      />
                      <Percent className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Flat Fee Override (₦)
                    </label>
                    <input
                      type="number"
                      value={newCommission.flat_fee}
                      onChange={(e) => setNewCommission({ ...newCommission, flat_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Merchant ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCommission.merchant_id}
                      onChange={(e) => setNewCommission({ ...newCommission, merchant_id: e.target.value })}
                      list="pricing-merchants"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="Leave blank for global default"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => handleSaveCommission(newCommission)}
                      disabled={saving}
                      className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save Commission"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Commission Rules Table */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-x-auto p-6">
                <div className="font-semibold text-gray-900 dark:text-white mb-4">
                  Active Commission Rules
                </div>
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Rule Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Rate / Fee</th>
                      <th className="px-4 py-3">Merchant Scope</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                          No commission rules defined.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-4 font-medium">{rule.name}</td>
                          <td className="px-4 py-4">{rule.rule_type}</td>
                          <td className="px-4 py-4 font-semibold text-emerald-600">
                            {rule.value}% {rule.flat_fee > 0 ? `+ ₦${rule.flat_fee}` : ""}
                          </td>
                          <td className="px-4 py-4 text-gray-500">
                            {rule.merchant_id ? `Merchant (${rule.merchant_id.slice(0, 8)})` : "Global Default"}
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                              Active
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => openEditModal("commission", rule)}
                              className="px-3 py-1 bg-emerald-50 dark:bg-gray-800 text-xs font-bold text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit Rule
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. DELIVERY PRICING TAB - FLAT BORDERLESS CARDS */}
          {activeTab === "delivery" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dynamic Delivery Pricing Formula
              </h3>
              <p className="text-sm text-gray-500">
                Formula: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono text-emerald-600">
                  Fee = Clamp(Base Fee + (Distance KM × Per KM Rate), Min, Max) × Surge
                </code>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Base Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={deliveryForm.base_fee}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, base_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Per KM Fee Rate (₦/KM)
                  </label>
                  <input
                    type="number"
                    value={deliveryForm.per_km_fee}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, per_km_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Minimum Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={deliveryForm.minimum_fee}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, minimum_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Maximum Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={deliveryForm.maximum_fee}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, maximum_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Surge Multiplier (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={deliveryForm.surge_multiplier}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, surge_multiplier: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Zone Name
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.zone_name}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, zone_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => handleSaveDelivery(deliveryForm)}
                  disabled={saving}
                  className="py-2.5 px-6 bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Update Delivery Pricing Formula"}
                </button>
              </div>
            </div>
          )}

          {/* 3. SERVICE FEE TAB - FLAT BORDERLESS CARDS */}
          {activeTab === "service" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Platform Service Fee Rule
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Service Fee Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={serviceFeeForm.value}
                    onChange={(e) => setServiceFeeForm({ ...serviceFeeForm, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Minimum Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={serviceFeeForm.minimum_fee}
                    onChange={(e) => setServiceFeeForm({ ...serviceFeeForm, minimum_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Maximum Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={serviceFeeForm.maximum_fee}
                    onChange={(e) => setServiceFeeForm({ ...serviceFeeForm, maximum_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => handleSaveServiceFee(serviceFeeForm)}
                  disabled={saving}
                  className="py-2.5 px-6 bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Update Service Fee"}
                </button>
              </div>
            </div>
          )}

          {/* 4. PROMOTIONS & DISCOUNT CAMPAIGNS TAB - FLAT BORDERLESS CARDS */}
          {activeTab === "promotions" && (
            <div className="space-y-6">
              {/* Create Promotion Form */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  Create Promotion Campaign
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Promo Code
                    </label>
                    <input
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })}
                      placeholder="e.g. WELCOME20"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm uppercase font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={promoForm.name}
                      onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                      placeholder="e.g. Weekend Free Delivery"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Promotion Type
                    </label>
                    <select
                      value={promoForm.promo_type}
                      onChange={(e) => setPromoForm({ ...promoForm, promo_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="PERCENTAGE">PERCENTAGE (% OFF)</option>
                      <option value="FIXED">FIXED DISCOUNT (₦ OFF)</option>
                      <option value="FREE_DELIVERY">FREE DELIVERY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Discount Value (% or ₦)
                    </label>
                    <input
                      type="number"
                      value={promoForm.discount_value}
                      onChange={(e) => setPromoForm({ ...promoForm, discount_value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Minimum Order Spend (₦)
                    </label>
                    <input
                      type="number"
                      value={promoForm.min_order_amount}
                      onChange={(e) => setPromoForm({ ...promoForm, min_order_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                      Funding Source
                    </label>
                    <select
                      value={promoForm.funding_source}
                      onChange={(e) => setPromoForm({ ...promoForm, funding_source: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="PLATFORM">PLATFORM FUNDED</option>
                      <option value="RESTAURANT">RESTAURANT FUNDED</option>
                      <option value="SHARED">SHARED 50/50</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleCreatePromo(promoForm)}
                    disabled={saving}
                    className="py-2 px-5 bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {saving ? "Creating..." : "Create Campaign"}
                  </button>
                </div>
              </div>

              {/* Promotions Table */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-x-auto p-6">
                <div className="font-semibold text-gray-900 dark:text-white mb-4">
                  Active Promotion Campaigns
                </div>
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Campaign Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Discount</th>
                      <th className="px-4 py-3">Funding</th>
                      <th className="px-4 py-3">Min Spend</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {promotions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                          No promotion campaigns found.
                        </td>
                      </tr>
                    ) : (
                      promotions.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-4 font-mono font-bold text-emerald-600">{p.code}</td>
                          <td className="px-4 py-4 font-medium">{p.name}</td>
                          <td className="px-4 py-4 text-xs font-semibold">{p.promo_type}</td>
                          <td className="px-4 py-4 font-semibold">
                            {p.promo_type === "PERCENTAGE" ? `${p.discount_value}%` : `₦${p.discount_value.toLocaleString()}`}
                          </td>
                          <td className="px-4 py-4 text-xs">
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium">
                              {p.funding_source}
                            </span>
                          </td>
                          <td className="px-4 py-4">₦{p.min_order_amount.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => openEditModal("promotion", p)}
                              className="px-3 py-1 bg-emerald-50 dark:bg-gray-800 text-xs font-bold text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit Promo
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* POPUP EDIT MODAL OVERLAY - FLAT & BORDERLESS */}
      {editingModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Edit {editingModal.type === "commission" ? "Commission Rule" : editingModal.type === "promotion" ? "Promotion Code" : "Pricing Rule"}
                </h3>
              </div>
              <button
                onClick={() => setEditingModal({ isOpen: false, type: null, data: null })}
                className="text-gray-400 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Commission Modal Body */}
            {editingModal.type === "commission" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    value={editingModal.data.value}
                    onChange={(e) => setEditingModal({
                      ...editingModal,
                      data: { ...editingModal.data, value: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Flat Fee Override (₦)
                  </label>
                  <input
                    type="number"
                    value={editingModal.data.flat_fee || 0}
                    onChange={(e) => setEditingModal({
                      ...editingModal,
                      data: { ...editingModal.data, flat_fee: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Merchant Scope (Optional ID)
                  </label>
                  <input
                    type="text"
                    value={editingModal.data.merchant_id || ""}
                    onChange={(e) => setEditingModal({
                      ...editingModal,
                      data: { ...editingModal.data, merchant_id: e.target.value }
                    })}
                    list="pricing-merchants"
                    placeholder="Leave blank for global default"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* Promotion Modal Body */}
            {editingModal.type === "promotion" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    value={editingModal.data.code}
                    onChange={(e) => setEditingModal({
                      ...editingModal,
                      data: { ...editingModal.data, code: e.target.value.toUpperCase() }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-mono font-bold text-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Discount Value (% or ₦)
                  </label>
                  <input
                    type="number"
                    value={editingModal.data.discount_value}
                    onChange={(e) => setEditingModal({
                      ...editingModal,
                      data: { ...editingModal.data, discount_value: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Funding Source
                  </label>
                  <select
                    value={editingModal.data.funding_source}
                    onChange={(e) => setEditingModal({
                      ...editingModal,
                      data: { ...editingModal.data, funding_source: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  >
                    <option value="PLATFORM">PLATFORM FUNDED</option>
                    <option value="RESTAURANT">RESTAURANT FUNDED</option>
                    <option value="SHARED">SHARED 50/50</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingModal({ isOpen: false, type: null, data: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (editingModal.type === "commission") {
                    handleSaveCommission(editingModal.data);
                  } else if (editingModal.type === "promotion") {
                    handleCreatePromo(editingModal.data);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving Changes..." : "Save Rule Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
