"use client";

import { useEffect, useState } from "react";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";
import { PENDING_PAYMENT_KEY } from "@/components/checkout/useCheckout";

export type PaymentReturnState = "idle" | "confirming" | "paid" | "pending" | "cancelled";

const POLL_MS = 3000;
const MAX_POLLS = 10;

/**
 * Handles landing back from Bachs (?paid=1&checkout_id=... or ?payment=cancelled).
 * Bachs' webhook is what actually marks the order paid, so we poll briefly for it.
 * Clears the cart once the order that was being paid for is confirmed.
 */
export function usePaymentReturn(
  orderId: string | null,
  params: URLSearchParams,
  guestToken?: string,
  onPaid?: () => void
): PaymentReturnState {
  const { clearCart } = usePlatform();
  const paid = params.get("paid") === "1";
  const cancelled = params.get("payment") === "cancelled";
  const checkoutId = params.get("checkout_id") || undefined;
  const [state, setState] = useState<PaymentReturnState>(paid ? "confirming" : cancelled ? "cancelled" : "idle");

  useEffect(() => {
    if (!orderId || !paid) return;
    let stopped = false;
    let polls = 0;

    const tick = async () => {
      polls += 1;
      try {
        const res = await apiService.confirmBachsCheckout({ order_id: orderId, checkout_id: checkoutId, guest_token: guestToken });
        if (stopped) return;
        if (res.payment_status === "paid") {
          setState("paid");
          try {
            const pending = JSON.parse(localStorage.getItem(PENDING_PAYMENT_KEY) || "null");
            if (pending?.orderId === orderId) {
              clearCart();
              localStorage.removeItem(PENDING_PAYMENT_KEY);
            }
          } catch {}
          onPaid?.();
          return;
        }
      } catch {}
      if (polls >= MAX_POLLS) setState("pending");
      else setTimeout(() => !stopped && tick(), POLL_MS);
    };
    tick();
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paid, checkoutId, guestToken]);

  return state;
}
