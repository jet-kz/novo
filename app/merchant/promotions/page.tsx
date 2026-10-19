"use client";

import React, { useState } from "react";
import { Ticket, Plus, Tag, Calendar, Check, X } from "lucide-react";

export default function MerchantPromotionsPage() {
  const [promos, setPromos] = useState([
    { id: "1", code: "WELCOME20", discount: "20% OFF", minOrder: "₦2,000", status: "Active", uses: 142 },
    { id: "2", code: "FREEDEL", discount: "Free Delivery", minOrder: "₦3,500", status: "Active", uses: 88 },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) return;
    setPromos((prev) => [
      ...prev,
      { id: String(Date.now()), code: code.toUpperCase(), discount, minOrder: "₦2,000", status: "Active", uses: 0 },
    ]);
    setIsOpen(false);
    setCode("");
    setDiscount("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Store Promotions & Discounts</h1>
          <p className="text-xs text-[#66736E] font-medium mt-1">Boost sales with promotional coupons and free delivery campaigns</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-[#087F5B] text-white text-xs font-bold hover:bg-[#065A43] transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {promos.map((p) => (
          <div key={p.id} className="bg-slate-50 dark:bg-slate-900/70 p-5 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#087F5B] flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 dark:text-white">{p.code}</span>
                <span className="text-xs font-bold text-[#087F5B] block">{p.discount}</span>
                <span className="text-[10px] text-slate-400 font-medium">Min Order: {p.minOrder} • {p.uses} Uses</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#087F5B] text-xs font-bold">{p.status}</span>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-slate-900/70 p-6 rounded-3xl max-w-md w-full flex flex-col gap-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Coupon</h3>
            <input
              type="text"
              placeholder="Promo Code (e.g. SAVE10)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
            />
            <input
              type="text"
              placeholder="Discount (e.g. 15% OFF or ₦500 OFF)"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              required
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-[#087F5B] text-white text-xs font-bold rounded-xl">Create Coupon</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
