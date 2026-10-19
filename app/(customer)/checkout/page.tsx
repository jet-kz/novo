"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Banknote, Landmark, ArrowRight, Heart, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCheckout, PaymentMethod } from "@/components/checkout/useCheckout";
import { MobileCheckoutView } from "@/components/mobile/checkout/MobileCheckoutView";
import { ContactFields } from "@/components/checkout/ContactFields";
import { DeliveryLocationField } from "@/components/checkout/DeliveryLocationField";
import { cartLineKey, optionsUnitPrice } from "@/utils/options";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: "card", label: "Pay online now", icon: <CreditCard className="w-5 h-5" /> },
  { id: "cash", label: "Cash on Delivery", icon: <Banknote className="w-5 h-5" /> },
  { id: "transfer", label: "Transfer on Delivery", icon: <Landmark className="w-5 h-5" /> },
];

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

export default function CheckoutPage() {
  const router = useRouter();
  const checkout = useCheckout();
  const { cart, summary, isQuote } = checkout;

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">Add delicious items to proceed with checkout.</p>
        <Button variant="primary" onClick={() => router.push("/shop")}>
          Browse Stores
        </Button>
      </div>
    );
  }

  return (
    <>
      <MobileCheckoutView checkout={checkout} />
      <div className="hidden md:block">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-h-screen">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mb-6">Checkout & Payment</h1>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7 flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs">
                <ContactFields checkout={checkout} />
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs">
                <DeliveryLocationField checkout={checkout} />
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-black text-base">Payment Method</h3>
                </div>
                <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Payment method">
                  {PAYMENT_OPTIONS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      role="radio"
                      aria-checked={checkout.paymentMethod === method.id}
                      onClick={() => checkout.setPaymentMethod(method.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-xs font-black transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        checkout.paymentMethod === method.id
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {method.icon}
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h3 className="font-black text-base text-slate-900 dark:text-slate-100">Tip Your Delivery Partner</h3>
                  </div>
                  <span className="text-xs text-slate-400">100% goes to rider</span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 300, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      aria-pressed={checkout.tip === amount}
                      onClick={() => checkout.setTip(amount)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        checkout.tip === amount
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {amount === 0 ? "No Tip" : naira(amount)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">Order Summary</h3>

                <div className="flex flex-col gap-2 border-slate-100 dark:border-slate-800 pb-4 text-xs">
                  {cart.map((item) => {
                    const unit = item.product.price + optionsUnitPrice(item.selectedOptions);
                    return (
                      <div key={cartLineKey(item)} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{naira(unit * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                {checkout.promoCode ? (
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span>Promo {checkout.promoCode} applied</span>
                    <button type="button" onClick={checkout.removePromo} className="underline cursor-pointer">
                      Remove
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      checkout.applyPromo();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={checkout.promoInput}
                      onChange={(e) => checkout.setPromoInput(e.target.value)}
                      placeholder="Promo code"
                      aria-label="Promo code"
                    />
                    <Button variant="secondary" type="submit" size="sm">
                      Apply
                    </Button>
                  </form>
                )}

                <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2" aria-live="polite">
                  <Row label="Subtotal" value={naira(summary.subtotal)} />
                  <Row label="Delivery Fee" value={naira(summary.delivery_fee)} />
                  {isQuote && <Row label="Platform Service Fee" value={naira(summary.service_fee)} />}
                  <Row label="Rider Tip" value={naira(summary.tip)} />
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promo Discount</span>
                      <span>-{naira(summary.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 dark:text-slate-100 pt-3 border-slate-100 dark:border-slate-800">
                    <span>{isQuote ? "Total" : "Estimated total"}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {checkout.quoteLoading ? "Calculating…" : naira(summary.total)}
                    </span>
                  </div>
                  {checkout.paymentMethod === "card" && (
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Info className="w-3.5 h-3.5" /> You&apos;ll pay securely on Bachs, then come straight back here.
                    </p>
                  )}
                </div>

                {checkout.notice && (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl p-3">
                    {checkout.notice}
                  </p>
                )}
                {checkout.error && (
                  <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {checkout.error}
                  </p>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  isLoading={checkout.isSubmitting}
                  disabled={checkout.isSubmitting || checkout.quoteLoading}
                  onClick={checkout.submit}
                  className="mt-2 w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {`${checkout.paymentMethod === "card" ? "Continue to payment" : "Place order"} • ${naira(summary.total)}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-bold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}
