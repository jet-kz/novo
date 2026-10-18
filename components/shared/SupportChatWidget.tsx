"use client";

import React, { useState } from "react";
import { MessageCircle, X, Send, Bot, User, PhoneCall, ShieldCheck } from "lucide-react";
import { useCartBarVisible } from "@/components/cart/CartBar";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const cartBarVisible = useCartBarVisible();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-1",
      sender: "bot",
      text: "👋 Hi! Welcome to Novo 24/7 Customer Support. How can we help you today?",
      time: "Just now",
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userQuery = input.toLowerCase();
    setInput("");

    // Instant bot assistance
    setTimeout(() => {
      let botResponse = "Our support team is checking your request. A live agent will connect with you shortly!";
      if (userQuery.includes("order") || userQuery.includes("track")) {
        botResponse = "To track your order, go to the 'Orders' tab in your navbar to see real-time driver ETA!";
      } else if (userQuery.includes("refund") || userQuery.includes("cancel")) {
        botResponse = "For cancellations or refund requests, please provide your Order ID from your Orders page.";
      } else if (userQuery.includes("promo") || userQuery.includes("discount")) {
        botResponse = "Enter any valid promotional code at checkout to enjoy discounts on your delivery!";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 700);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${cartBarVisible ? "bottom-[calc(140px+env(safe-area-inset-bottom,0px))] md:bottom-28" : "bottom-24 md:bottom-6"} right-5 z-40 p-4 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-2xl hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2 group`}
        title="24/7 Novo Customer Support"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden group-hover:inline text-xs font-black tracking-wide pr-1">
          Novo Care 24/7
        </span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 sm:bottom-20 right-4 sm:right-6 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col h-[480px] animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-black text-sm leading-none">Novo Care 24/7</h4>
                <span className="text-[10px] font-semibold text-emerald-100 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" />
                  Online • Instant Assistance
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50 dark:bg-slate-950/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 max-w-[85%] ${
                  m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-xs"
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 ${
                      m.sender === "user" ? "text-emerald-100 text-right" : "text-slate-400"
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or get help..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="p-2.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
