"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  MessageSquare,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export function MobileSupportView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Novo delivery work?",
      a: "Simply browse stores, add products or meals to your cart, specify your delivery address, and place your order. Our riders pick up and deliver directly to your door.",
    },
    {
      q: "How can I track my active order?",
      a: "Navigate to the Orders tab in your bottom navigation and click on any active order to view real-time status and rider location.",
    },
    {
      q: "What payment methods are supported?",
      a: "Novo supports debit/credit cards, cash on delivery, bank transfer, and Apple Pay.",
    },
    {
      q: "How do I request a refund?",
      a: "If your order has an issue, tap 'Report an Issue' below or contact Live Support with your order ID.",
    },
  ];

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3 flex items-center gap-3 shadow-xs">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-black text-[#101714] dark:text-white">Help & Support</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Support Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => alert("Initiating Live Chat with Novo Support...")}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 flex flex-col gap-2 shadow-xs cursor-pointer hover:border-[#008A4C] text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F7EF] text-[#008A4C] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-black text-[#101714] dark:text-white">Live Chat</h3>
            <p className="text-[10px] text-[#66736D]">Chat with 24/7 support team</p>
          </button>

          <a
            href="mailto:support@novo.ng"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 flex flex-col gap-2 shadow-xs cursor-pointer hover:border-[#008A4C] text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F7EF] text-[#008A4C] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-black text-[#101714] dark:text-white">Contact Us</h3>
            <p className="text-[10px] text-[#66736D]">Get in touch via email</p>
          </a>
        </div>

        {/* FAQs Accordion */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 flex flex-col gap-3 shadow-xs">
          <span className="text-xs font-black uppercase text-[#66736D] tracking-wider">
            Frequently Asked Questions
          </span>

          <div className="flex flex-col gap-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E3EAE6] dark:border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-[#101714] dark:text-white bg-[#F7FAF8] dark:bg-slate-800/60 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180 text-[#008A4C]" : "text-slate-400"}`} />
                  </button>
                  {isOpen && (
                    <div className="p-3 text-[11px] font-medium text-[#66736D] dark:text-slate-300 leading-relaxed border-t border-[#E3EAE6] dark:border-slate-800 bg-white dark:bg-slate-900">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Policy & Terms Links */}
        <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs flex flex-col">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("Opening Novo Privacy Policy..."); }}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7FAF8] dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#008A4C]" />
              <span className="text-xs font-bold text-[#101714] dark:text-slate-200">Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("Opening Terms & Conditions..."); }}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7FAF8] dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#008A4C]" />
              <span className="text-xs font-bold text-[#101714] dark:text-slate-200">Terms & Conditions</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
