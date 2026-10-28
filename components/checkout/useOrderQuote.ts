"use client";

import { useEffect, useState } from "react";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";

export interface CheckoutQuote {
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount: number;
  tip: number;
  total: number;
  applied_promo_code: string | null;
  promo_valid: boolean | null;
  /** Why a promo code didn't apply (or the applied message). */
  promo_message?: string | null;
}

/** The order lines the server prices, in the shape /orders/quote and order creation expect. */
export function useOrderLines() {
  const { cart, userLocationCoords } = usePlatform();
  const storeId = cart[0]?.product?.storeId || "";
  const items = cart.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
    addons: (item.selectedOptions || []).map((o) => ({ id: o.id, name: o.name, quantity: o.quantity || 1 })),
    note: item.specialInstructions?.trim() || undefined,
  }));
  const coords = userLocationCoords
    ? { delivery_latitude: userLocationCoords.lat, delivery_longitude: userLocationCoords.lon }
    : {};
  return { storeId, items, coords, key: JSON.stringify([storeId, items, coords]) };
}

/**
 * The server's price for the current cart: subtotal, delivery fee (by distance to the picked
 * location), service fee, discount and total. Cart and checkout both use this, so they always
 * show the same numbers; checkout only adds the tip and promo the customer chooses there.
 */
export function useOrderQuote(options: { tip?: number; promoCode?: string | null; enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const { isAuthenticated } = usePlatform();
  const { storeId, items, coords, key } = useOrderLines();
  const tip = options.tip || 0;
  const promoCode = isAuthenticated ? options.promoCode || null : null; // promos need an account
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !storeId || items.length === 0) {
      setQuote(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      const request = { store_id: storeId, items, tip, promo_code: promoCode || undefined, ...coords };
      (isAuthenticated ? apiService.quoteOrder(request) : apiService.quoteGuestOrder(request))
        .then((q) => {
          if (cancelled) return;
          setQuote(q);
          setError(null);
        })
        .catch((e) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isAuthenticated, key, tip, promoCode]);

  return { quote, loading, error };
}
