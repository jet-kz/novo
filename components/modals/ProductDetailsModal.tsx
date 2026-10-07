"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Minus,
  CheckCircle2,
  Check,
  Flame,
  Star,
  Clock,
  UtensilsCrossed,
  Sparkles,
  Users,
} from "lucide-react";
import { Product } from "@/types";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedOptions: any[],
    specialInstructions: string
  ) => void;
}

// Sample Protein / Base option cards if none are provided on the product
const DEFAULT_PROTEIN_OPTIONS = [
  {
    id: "prot-1",
    name: "Grilled Chicken",
    price: 0,
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "prot-2",
    name: "Succulent Beef",
    price: 800,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "prot-3",
    name: "Pan Fried Fish",
    price: 600,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=200&q=80",
  },
];

// Sample Extras / Add-ons if none are provided
const DEFAULT_EXTRAS = [
  { id: "ext-1", name: "Fried Plantain (Dodo)", price: 500 },
  { id: "ext-2", name: "Fresh Side Salad", price: 800 },
  { id: "ext-3", name: "Extra Pepper Sauce", price: 300 },
];

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !product) return null;

  const proteinList = useMemo(() => {
    if (product.proteinOptions && product.proteinOptions.length > 0) {
      return product.proteinOptions;
    }
    return DEFAULT_PROTEIN_OPTIONS;
  }, [product]);

  const extrasList = useMemo(() => {
    if (product.extrasOptions && product.extrasOptions.length > 0) {
      return product.extrasOptions;
    }
    if (product.options && product.options.length > 0) {
      return product.options;
    }
    return DEFAULT_EXTRAS;
  }, [product]);

  const specsInfo = useMemo(() => {
    return {
      prepTime: product.specs?.prepTime || (product.preparationTimeMinutes ? `${product.preparationTimeMinutes} min` : "15-20 min"),
      spicyLevel: product.specs?.spicyLevel || "Medium 🌶️",
      calories: product.specs?.calories || "650 kcal",
      serves: product.specs?.serves || "1 person",
    };
  }, [product]);

  const [quantity, setQuantity] = useState(1);
  const [selectedProtein, setSelectedProtein] = useState(proteinList[0] || null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([extrasList[0]?.id || "ext-1"]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const extrasTotalPrice = useMemo(() => {
    let sum = 0;
    if (selectedProtein && selectedProtein.price) {
      sum += selectedProtein.price;
    }
    extrasList.forEach((ext: any) => {
      if (selectedExtras.includes(ext.id)) {
        sum += ext.price || 0;
      }
    });
    return sum;
  }, [selectedProtein, selectedExtras, extrasList]);

  const unitTotal = product.price + extrasTotalPrice;
  const grandTotal = unitTotal * quantity;

  const handleAdd = () => {
    const formattedOptions = [
      ...(selectedProtein ? [{ id: selectedProtein.id, name: selectedProtein.name, price: selectedProtein.price }] : []),
      ...extrasList
        .filter((ext: any) => selectedExtras.includes(ext.id))
        .map((ext: any) => ({ id: ext.id, name: ext.name, price: ext.price })),
    ];
    onAddToCart(product, quantity, formattedOptions, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto shadow-2xl relative scrollbar-none">
        {/* 1. TOP HEADER WITH TITLE & CLOSE BUTTON */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6] dark:border-slate-800">
          <h3 className="text-base font-black text-[#101714] dark:text-white">Product Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#66736D] dark:text-slate-300 hover:text-[#101714] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. HERO IMAGE CONTAINER */}
        <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 3. PRODUCT TITLE, PRICE, RATING & POPULAR BADGE */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-black text-[#101714] dark:text-white leading-tight">
              {product.name}
            </h2>
            <span className="text-lg sm:text-xl font-black text-[#008A4C] dark:text-emerald-400 shrink-0">
              ₦{product.price.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#66736D] dark:text-slate-400">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                {product.rating || "4.9"}
              </span>
              <span>•</span>
              <span>320 reviews</span>
            </div>

            <div className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#008A4C] dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1">
              <Flame className="w-3 h-3 text-emerald-600 fill-emerald-600" />
              <span>Popular</span>
            </div>
          </div>

          <p className="text-xs text-[#66736D] dark:text-slate-400 leading-relaxed font-medium mt-1">
            {product.description || "Delicious party-style meal prepared with fresh local ingredients and aromatic spices."}
          </p>
        </div>

        {/* 4. CHOOSE PROTEIN (HORIZONTAL CARDS WITH IMAGE & CHECKMARK) */}
        {proteinList.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-3 border-t border-[#E3EAE6] dark:border-slate-800">
            <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
              Choose Protein
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              {proteinList.map((prot: any) => {
                const isSelected = selectedProtein?.id === prot.id;
                return (
                  <button
                    key={prot.id}
                    onClick={() => setSelectedProtein(prot)}
                    className={`relative flex flex-col items-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#008A4C] bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] dark:text-emerald-300 ring-2 ring-[#008A4C]/20"
                        : "border-[#E3EAE6] dark:border-slate-800 bg-white dark:bg-slate-800/40 text-[#101714] dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#008A4C] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="w-10 h-10 rounded-full overflow-hidden mb-1.5 bg-slate-200 shrink-0">
                      <img
                        src={prot.image || "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=200&q=80"}
                        alt={prot.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span className="text-[11px] font-bold leading-tight">{prot.name}</span>
                    <span className="text-[10px] font-extrabold text-[#66736D] dark:text-slate-400 mt-0.5">
                      {prot.price === 0 ? "NO" : `+ ₦${prot.price}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. ADD EXTRAS LIST */}
        {extrasList.length > 0 && (
          <div className="flex flex-col gap-2 pt-3 border-t border-[#E3EAE6] dark:border-slate-800">
            <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
              Add Extras
            </span>

            <div className="flex flex-col gap-2">
              {extrasList.map((ext: any) => {
                const isChecked = selectedExtras.includes(ext.id);
                return (
                  <div
                    key={ext.id}
                    onClick={() => toggleExtra(ext.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAF8] dark:bg-slate-800/50 border border-[#E3EAE6] dark:border-slate-800 cursor-pointer hover:border-[#008A4C] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#008A4C] flex items-center justify-center font-bold text-xs shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#101714] dark:text-white">
                        {ext.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#66736D] dark:text-slate-400">
                        + ₦{ext.price}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? "bg-[#008A4C] border-[#008A4C] text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. QUANTITY STEPPER & ADD TO CART CTA BAR */}
        <div className="flex items-center gap-3 pt-3 border-t border-[#E3EAE6] dark:border-slate-800 mt-1">
          <div className="flex items-center gap-3 bg-[#F7FAF8] dark:bg-slate-800 px-3 py-2 rounded-2xl border border-[#E3EAE6] dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-[#101714] dark:text-white flex items-center justify-center font-black shadow-xs hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black w-4 text-center text-[#101714] dark:text-white">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-[#101714] dark:text-white flex items-center justify-center font-black shadow-xs hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white font-black text-xs flex items-center justify-between shadow-lg shadow-emerald-600/20 cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>Add to Cart</span>
            <span>₦{grandTotal.toLocaleString()}</span>
          </button>
        </div>

        {/* 7. NUTRITIONAL & PREP INFO SPECS GRID */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#E3EAE6] dark:border-slate-800 text-center">
          <div className="flex flex-col items-center p-2 rounded-xl bg-[#F7FAF8] dark:bg-slate-800/50 border border-[#E3EAE6] dark:border-slate-800">
            <Clock className="w-4 h-4 text-[#008A4C] mb-1" />
            <span className="text-[9px] text-[#66736D] dark:text-slate-400 font-semibold">Prep Time</span>
            <span className="text-[10px] font-black text-[#101714] dark:text-white mt-0.5">{specsInfo.prepTime}</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-xl bg-[#F7FAF8] dark:bg-slate-800/50 border border-[#E3EAE6] dark:border-slate-800">
            <Flame className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[9px] text-[#66736D] dark:text-slate-400 font-semibold">Spicy Level</span>
            <span className="text-[10px] font-black text-[#101714] dark:text-white mt-0.5">{specsInfo.spicyLevel}</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-xl bg-[#F7FAF8] dark:bg-slate-800/50 border border-[#E3EAE6] dark:border-slate-800">
            <UtensilsCrossed className="w-4 h-4 text-[#008A4C] mb-1" />
            <span className="text-[9px] text-[#66736D] dark:text-slate-400 font-semibold">Calories</span>
            <span className="text-[10px] font-black text-[#101714] dark:text-white mt-0.5">{specsInfo.calories}</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-xl bg-[#F7FAF8] dark:bg-slate-800/50 border border-[#E3EAE6] dark:border-slate-800">
            <Users className="w-4 h-4 text-[#008A4C] mb-1" />
            <span className="text-[9px] text-[#66736D] dark:text-slate-400 font-semibold">Serves</span>
            <span className="text-[10px] font-black text-[#101714] dark:text-white mt-0.5">{specsInfo.serves}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
