"use client";

import React from "react";
import Link from "next/link";
import { Star, Clock, Bike, ShieldCheck, Heart } from "lucide-react";
import { Store } from "@/types";
import { usePlatform } from "@/store/PlatformContext";
import { getUniqueStoreBanner, getUniqueStoreLogo } from "@/utils/storeImageUtils";

interface RestaurantCardProps {
  store: Store;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ store }) => {
  const { favorites, toggleFavorite } = usePlatform();
  const isFav = favorites.includes(store.id);

  const bannerUrl = getUniqueStoreBanner(store);
  const logoUrl = getUniqueStoreLogo(store);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(store.id);
  };

  return (
    <Link
      href={`/shop?store=${store.id}`}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* Banner & Badge */}
      <div className="relative h-44 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <img
          src={bannerUrl}
          alt={store.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavorite}
          className="absolute top-3 left-3 p-2 rounded-full bg-slate-950/40 hover:bg-slate-950/70 backdrop-blur-md transition-transform active:scale-90 text-white cursor-pointer"
          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? "fill-rose-500 text-rose-500" : "text-white"
            }`}
          />
        </button>

        {/* Rating Badge */}
        {store.rating > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/85 backdrop-blur-md text-xs font-black text-slate-900 dark:text-slate-100 shadow-md">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{store.rating.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400 font-medium">({store.reviewCount})</span>
        </div>
        )}

        {/* Store Logo */}
        <div className="absolute bottom-3 left-3 w-12 h-12 rounded-2xl border-2 border-white dark:border-slate-900 overflow-hidden bg-white shadow-md">
          <img src={logoUrl} alt={store.name} className="w-full h-full object-cover" />
        </div>

        {/* Cuisine Badge */}
        {store.cuisineType && (
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/70 text-slate-200 backdrop-blur-md">
            {store.cuisineType}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
              {store.name}
            </h3>
            {store.isVerified && (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {store.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pt-3 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>{store.deliveryTime}</span>
          </div>

          <div className="flex items-center gap-1">
            <Bike className="w-3.5 h-3.5 text-slate-400" />
            <span>₦{store.deliveryFee} fee</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
