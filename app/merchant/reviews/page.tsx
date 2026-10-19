"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageSquare, CornerDownRight } from "lucide-react";

export default function MerchantReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("merchant_reviews");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setReviews(parsed);
        } catch (e) {}
      }
    }
  }, []);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : "0.0";

  const handleReplySubmit = (id: string) => {
    setReviews((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, reply: replyText } : r));
      if (typeof window !== "undefined") {
        localStorage.setItem("merchant_reviews", JSON.stringify(updated));
      }
      return updated;
    });
    setReplyId(null);
    setReplyText("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Reviews & Ratings</h1>
        <p className="text-xs text-[#66736E] font-medium mt-1">See customer feedback, ratings and respond to reviews</p>
      </div>

      {/* RATING OVERVIEW CARD */}
      <div className="bg-slate-50 dark:bg-slate-900/70 p-6 rounded-3xl flex items-center gap-8">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-slate-900 dark:text-white">{averageRating}</span>
          <div className="flex items-center text-amber-400 my-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(Number(averageRating))
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-700"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-[#66736E] font-semibold">
            {reviews.length === 0 ? "New Store (0 Reviews)" : `${reviews.length} Reviews`}
          </span>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <div className="py-16 bg-slate-50 dark:bg-slate-900/70 rounded-3xl text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              No customer reviews yet
            </span>
            <span className="text-xs font-medium text-slate-500 max-w-sm">
              As customers complete orders and leave feedback on your store, their ratings and reviews will appear here.
            </span>
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-slate-50 dark:bg-slate-900/70 p-5 rounded-3xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{rev.author}</span>
                <span className="text-xs text-slate-400">{rev.date}</span>
              </div>

              <div className="flex items-center text-amber-400">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{rev.comment}</p>

              {rev.reply ? (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-slate-800 flex items-start gap-2 text-xs font-semibold text-[#087F5B]">
                  <CornerDownRight className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Store Reply:</span>
                    <span>{rev.reply}</span>
                  </div>
                </div>
              ) : replyId === rev.id ? (
                <div className="flex flex-col gap-2 mt-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a public reply..."
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setReplyId(null)} className="px-3 py-1.5 text-xs text-slate-500">Cancel</button>
                    <button onClick={() => handleReplySubmit(rev.id)} className="px-4 py-1.5 bg-[#087F5B] text-white text-xs font-bold rounded-xl">Post Reply</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReplyId(rev.id)}
                  className="w-fit text-xs font-bold text-[#087F5B] hover:underline"
                >
                  Reply to Review
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
