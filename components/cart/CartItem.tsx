"use client";

import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/types";
import { cartLineKey, optionsLabel, optionsUnitPrice } from "@/utils/options";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const itemOptionsTotal = optionsUnitPrice(item.selectedOptions);
  const unitPrice = item.product.price + itemOptionsTotal;
  const totalPrice = unitPrice * item.quantity;

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
      <img
        src={item.product.image}
        alt={item.product.name}
        className="w-14 h-14 rounded-xl object-cover shrink-0"
      />

      <div className="flex-1 min-w-0">
        <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
          {item.product.name}
        </h5>
        <span className="text-xs font-black text-slate-900 dark:text-slate-200">
          ₦{totalPrice.toLocaleString()}
        </span>
        {item.selectedOptions && item.selectedOptions.length > 0 && (
          <p className="text-[10px] text-slate-400 truncate">
            {optionsLabel(item.selectedOptions)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-xs">
        <button
          onClick={() => onUpdateQuantity(cartLineKey(item), item.quantity - 1)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
        >
          {item.quantity === 1 ? (
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
        </button>
        <span className="text-xs font-black w-5 text-center text-slate-900 dark:text-slate-100">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(cartLineKey(item), item.quantity + 1)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
