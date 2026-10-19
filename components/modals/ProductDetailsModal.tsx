"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, FileText, Flame, Minus, Package, Pill, Plus, Tag, Users, UtensilsCrossed, X } from "lucide-react";
import { OptionGroup, Product, SelectedOption } from "@/types";
import { groupRule, optionGroupsOf } from "@/utils/options";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedOptions: SelectedOption[], specialInstructions: string) => void;
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

/** "Choose your protein" stays as is; "Size" becomes "Choose size". */
const choosePrompt = (groupName: string) =>
  /^(choose|pick|select)\b/i.test(groupName.trim()) ? groupName.trim() : `Choose ${groupName.trim().toLowerCase()}`;

/** Item sheet: photo, the merchant's option groups, quantity and notes. Bottom sheet on phones. */
export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && product && (
        <motion.div
          key="product-sheet"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            className="relative w-full sm:max-w-lg max-h-[94dvh] sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden"
            initial={{ y: 48, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
          >
            <SheetBody key={product.id} product={product} onClose={onClose} onAddToCart={onAddToCart} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function SheetBody({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: ProductDetailsModalProps["onAddToCart"];
}) {
  const groups = useMemo(() => optionGroupsOf(product), [product]);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [showMissing, setShowMissing] = useState(false);
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});

  const countIn = (g: OptionGroup) => g.options.reduce((n, o) => n + (picks[o.id] || 0), 0);
  const missing = groups.filter((g) => countIn(g) < (g.min || 0));

  const setPick = (g: OptionGroup, optionId: string, qty: number) => {
    setPicks((prev) => {
      const next = { ...prev };
      if (g.max === 1 && qty > 0) {
        // Single choice: picking one replaces the other.
        for (const o of g.options) delete next[o.id];
      }
      if (qty <= 0) delete next[optionId];
      else next[optionId] = qty;
      return next;
    });
  };

  const selected: SelectedOption[] = groups.flatMap((g) =>
    g.options
      .filter((o) => picks[o.id])
      .map((o) => ({ id: o.id, name: o.name, price: o.price, quantity: picks[o.id], group: g.name }))
  );
  const unit = product.price + selected.reduce((s, o) => s + o.price * (o.quantity || 1), 0);

  const add = () => {
    if (missing.length) {
      setShowMissing(true);
      groupRefs.current[missing[0].id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAddToCart(product, quantity, selected, note.trim());
    onClose();
  };

  const specs = [
    { icon: <Clock className="w-4 h-4" />, label: "Ready in", value: product.specs?.prepTime || (product.preparationTimeMinutes ? `${product.preparationTimeMinutes} min` : "") },
    { icon: <Flame className="w-4 h-4" />, label: "Spice", value: product.specs?.spicyLevel || "" },
    { icon: <UtensilsCrossed className="w-4 h-4" />, label: "Energy", value: product.specs?.calories || "" },
    { icon: <Users className="w-4 h-4" />, label: "Serves", value: product.specs?.serves || "" },
    { icon: <Tag className="w-4 h-4" />, label: "Brand", value: product.specs?.brand || "" },
    { icon: <Package className="w-4 h-4" />, label: "Size", value: [product.specs?.size, product.specs?.unit].filter(Boolean).join(" ") },
    { icon: <Pill className="w-4 h-4" />, label: "Strength", value: [product.specs?.strength, product.specs?.dosageForm].filter(Boolean).join(" · ") },
    { icon: <Package className="w-4 h-4" />, label: "Pack", value: product.specs?.packSize || "" },
  ].filter((s) => s.value);

  return (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-none">
        <div className="relative w-full aspect-[16/10] bg-slate-100 dark:bg-slate-800">
          {product.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt="" className="w-full h-full object-cover" />
          )}
          <span className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-white/70" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-snug">{product.name}</h2>
            <span className="text-lg font-extrabold text-[#087F5B] dark:text-emerald-400 shrink-0">{naira(product.price)}</span>
          </div>
          {product.description && <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{product.description}</p>}
          {product.specs?.requiresPrescription && (
            <p className="mt-2 flex items-start gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-sm px-4 py-3">
              <FileText className="w-4 h-4 mt-0.5 shrink-0" />
              Prescription required. The pharmacy will ask to see it before handing this over.
            </p>
          )}
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {specs.map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="text-[#087F5B] dark:text-emerald-400">{s.icon}</span>
                  {s.value}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 px-3 pb-3">
          {groups.map((g) => {
            const count = countIn(g);
            const full = count >= g.max;
            const isMissing = showMissing && count < (g.min || 0);
            const single = g.max === 1;
            return (
              <section
                key={g.id}
                ref={(el) => {
                  groupRefs.current[g.id] = el;
                }}
                className={`rounded-3xl p-4 transition-colors ${isMissing ? "bg-rose-50 dark:bg-rose-950/30" : "bg-slate-50/80 dark:bg-slate-800/40"}`}
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{g.name}</h3>
                    <p className={`text-xs mt-0.5 ${isMissing ? "text-rose-600 font-semibold" : "text-slate-500"}`}>
                      {isMissing ? "Please choose to continue" : groupRule(g)}
                    </p>
                  </div>
                  {(g.min || 0) > 0 && count >= g.min ? (
                    <span className="w-6 h-6 rounded-full bg-[#087F5B] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : !single && count > 0 ? (
                    <span className="text-xs font-bold text-slate-500 shrink-0">{count}/{g.max}</span>
                  ) : null}
                </div>

                <ul className="flex flex-col gap-1.5">
                  {g.options.map((o) => {
                    const qty = picks[o.id] || 0;
                    const soldOut = o.available === false;
                    const maxQty = Math.max(1, o.max_qty || 1);
                    const blocked = soldOut || (!qty && full && !single);
                    return (
                      <li key={o.id}>
                        <div
                          role={single ? "radio" : "checkbox"}
                          aria-checked={qty > 0}
                          aria-disabled={blocked}
                          tabIndex={blocked ? -1 : 0}
                          onClick={() => !blocked && setPick(g, o.id, qty ? (single && (g.min || 0) > 0 ? qty : 0) : 1)}
                          onKeyDown={(e) => {
                            if ((e.key === " " || e.key === "Enter") && !blocked) {
                              e.preventDefault();
                              setPick(g, o.id, qty ? (single && (g.min || 0) > 0 ? qty : 0) : 1);
                            }
                          }}
                          className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all select-none ${
                            qty
                              ? "bg-white dark:bg-slate-900 shadow-sm ring-2 ring-[#087F5B]"
                              : "bg-white dark:bg-slate-900"
                          } ${blocked ? "opacity-45 cursor-not-allowed" : "cursor-pointer active:scale-[0.99]"}`}
                        >
                          <span
                            className={`w-5 h-5 shrink-0 flex items-center justify-center transition-colors ${single ? "rounded-full" : "rounded-md"} ${
                              qty ? "bg-[#087F5B] text-white" : "bg-slate-100 dark:bg-slate-800"
                            }`}
                          >
                            {qty > 0 && (single ? <span className="w-2 h-2 rounded-full bg-white" /> : <Check className="w-3.5 h-3.5" />)}
                          </span>
                          {o.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={o.image} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          )}
                          <span className="flex-1 min-w-0 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{o.name}</span>
                          {soldOut ? (
                            <span className="text-xs font-bold text-rose-500">Sold out</span>
                          ) : qty > 0 && maxQty > 1 && !single ? (
                            <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <StepButton label={`One less ${o.name}`} onClick={() => setPick(g, o.id, qty - 1)}>
                                <Minus className="w-3.5 h-3.5" />
                              </StepButton>
                              <span className="w-5 text-center text-sm font-bold">{qty}</span>
                              <StepButton label={`One more ${o.name}`} disabled={qty >= maxQty || full} onClick={() => setPick(g, o.id, qty + 1)}>
                                <Plus className="w-3.5 h-3.5" />
                              </StepButton>
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                              {o.price > 0 ? `+${naira(o.price)}` : "Free"}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          <label className="rounded-3xl p-4 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Note for the store <span className="font-normal text-slate-400">(optional)</span></span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="e.g. No onions, extra pepper"
              className="w-full resize-none rounded-2xl bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#087F5B]/40 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </label>
        </div>
      </div>

      <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-slate-900 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] flex items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
          <StepButton label="Fewer" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))} large>
            <Minus className="w-4 h-4" />
          </StepButton>
          <span className="w-7 text-center text-sm font-bold text-slate-900 dark:text-white">{quantity}</span>
          <StepButton label="More" disabled={quantity >= 50} onClick={() => setQuantity((q) => Math.min(50, q + 1))} large>
            <Plus className="w-4 h-4" />
          </StepButton>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!product.inStock}
          className={`flex-1 min-w-0 h-12 px-5 rounded-2xl text-white text-sm font-bold flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${
            !product.inStock ? "bg-slate-300 dark:bg-slate-700" : missing.length ? "bg-[#087F5B]/70" : "bg-[#087F5B] hover:bg-[#066A4C]"
          }`}
        >
          <span className="truncate text-left">{!product.inStock ? "Sold out" : missing.length ? choosePrompt(missing[0].name) : "Add to cart"}</span>
          {product.inStock && <span className="shrink-0 pl-3">{naira(unit * quantity)}</span>}
        </button>
      </div>
    </>
  );
}

function StepButton({
  children,
  onClick,
  disabled,
  label,
  large,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`${large ? "w-10 h-10" : "w-7 h-7"} rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center shadow-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
