"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ShoppingBag, Tag, Store, CheckCircle2 } from "lucide-react";

export function MobileNotificationsView() {
  const router = useRouter();

  const notifications = [
    {
      id: "n-1",
      title: "Your order is on the way!",
      description: "Chicken Republic • 12 min ago",
      icon: ShoppingBag,
      time: "12 min ago",
      unread: true,
    },
    {
      id: "n-2",
      title: "Order confirmed",
      description: "#ORD123456 • 25 min ago",
      icon: CheckCircle2,
      time: "25 min ago",
      unread: false,
    },
    {
      id: "n-3",
      title: "Get 10% off your next order!",
      description: "Use code NOVO10 • 2 hours ago",
      icon: Tag,
      time: "2h ago",
      unread: false,
    },
    {
      id: "n-4",
      title: "New store nearby",
      description: "Spar Supermarket is now available in your area • 5 hours ago",
      icon: Store,
      time: "5h ago",
      unread: false,
    },
    {
      id: "n-5",
      title: "Welcome to Novo!",
      description: "We're happy to have you • 1 day ago",
      icon: Bell,
      time: "1d ago",
      unread: false,
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
        <h1 className="text-sm font-black text-[#101714] dark:text-white">Notifications</h1>
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                n.unread
                  ? "bg-[#E8F7EF]/60 border-[#008A4C] dark:bg-slate-800"
                  : "bg-white dark:bg-slate-900 border-[#E3EAE6] dark:border-slate-800"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#101714] dark:text-white truncate">
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-[#66736D]">{n.time}</span>
                </div>
                <p className="text-[11px] text-[#66736D] dark:text-slate-400 font-medium leading-tight">
                  {n.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
