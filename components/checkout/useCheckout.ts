"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";
import { guestTrackingPath, saveGuestOrder } from "@/utils/guestOrders";

export type PaymentMethod = "card" | "cash" | "transfer";

export interface CheckoutQuote {
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount: number;
  tip: number;
  total: number;
  applied_promo_code: string | null;
  promo_valid: boolean | null;
}

/** Set before redirecting to Bachs so the cart is cleared only once payment succeeds. */
export const PENDING_PAYMENT_KEY = "novo_pending_payment";

const phoneDigits = (v: string) => v.replace(/\D/g, "");
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * One checkout flow for desktop and mobile, for signed-in customers and guests. The server quote
 * is what we show, and the created order's total is what we charge — the browser never decides
 * the price. Card payments go through Bachs hosted checkout (redirect), confirmed by webhook.
 */
export function useCheckout() {
  const router = useRouter();
  const { cart, cartSubtotal, cartDeliveryFee, currentUser, isAuthenticated, userLocationAddress, userLocationCoords, placeOrder, cancelOrder, clearCart, stores } =
    usePlatform();

  // Contact details. Signed-in customers get theirs prefilled; guests must give name + phone.
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  useEffect(() => {
    setContactName((prev) => prev || currentUser.name || "");
    setContactPhone((prev) => prev || currentUser.phone || "");
    setContactEmail((prev) => prev || currentUser.email || "");
  }, [currentUser.name, currentUser.phone, currentUser.email]);

  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [tip, setTip] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    setAddress((prev) => prev || currentUser.address || "");
  }, [currentUser.address]);

  const storeId = cart[0]?.product?.storeId || "";
  const orderLines = cart.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
    addons: (item.selectedOptions || []).map((o) => ({ id: o.id, name: o.name })),
  }));
  const linesKey = JSON.stringify(orderLines);

  const baseRequest = () => ({
    store_id: storeId,
    items: orderLines,
    tip,
    promo_code: promoCode || undefined,
    ...(userLocationCoords ? { delivery_latitude: userLocationCoords.lat, delivery_longitude: userLocationCoords.lon } : {}),
  });

  // Re-quote whenever anything that affects price changes.
  useEffect(() => {
    if (cart.length === 0 || !storeId) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    const timer = setTimeout(() => {
      (isAuthenticated ? apiService.quoteOrder(baseRequest()) : apiService.quoteGuestOrder(baseRequest()))
        .then((q) => {
          if (cancelled) return;
          setQuote(q);
          setError(null);
          if (promoCode && q.promo_valid === false) {
            setNotice(`Promo code ${promoCode} can't be used on this order.`);
            setPromoCode(null);
          }
        })
        .catch((e) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setQuoteLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, linesKey, storeId, tip, promoCode, userLocationCoords?.lat, userLocationCoords?.lon]);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    setNotice(null);
    if (!code) return;
    if (!isAuthenticated) {
      setNotice("Sign in to use a promo code.");
      return;
    }
    setPromoCode(code);
  };

  const removePromo = () => {
    setPromoCode(null);
    setPromoInput("");
  };

  const finish = (order: any) => {
    const saved = placeOrder(address, paymentMethod, tip, order);
    router.push(`/orders?orderId=${encodeURIComponent(saved.id)}`);
  };

  const fail = (message: string) => {
    setError(message);
    submittingRef.current = false;
    setIsSubmitting(false);
  };

  const submit = async () => {
    if (submittingRef.current) return; // guard against double taps
    setError(null);
    setNotice(null);
    if (cart.length === 0) return setError("Your cart is empty.");
    const deliveryAddress = (address || userLocationAddress || "").trim();
    if (deliveryAddress.length < 5) return setError("Please enter your delivery address.");
    if (contactName.trim().length < 2) return setError("Please enter your name.");
    if (phoneDigits(contactPhone).length < 10) return setError("Please enter a phone number the rider can call.");
    if (contactEmail.trim() && !EMAIL_RE.test(contactEmail.trim())) return setError("That email address doesn't look right.");

    submittingRef.current = true;
    setIsSubmitting(true);
    const request = {
      ...baseRequest(),
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      customer_name: contactName.trim(),
      customer_phone: contactPhone.trim(),
      customer_email: contactEmail.trim() || undefined,
    };

    let order: any;
    let guestToken: string | undefined;
    try {
      if (isAuthenticated) {
        order = await apiService.createOrder(request);
      } else {
        const created = await apiService.createGuestOrder(request);
        order = created.order;
        guestToken = created.guestToken;
        saveGuestOrder({
          id: order.id,
          token: guestToken,
          storeName: order.storeName || stores.find((s) => s.id === order.storeId)?.name,
          total: order.total,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      return fail(e.message || "Could not place your order.");
    }

    if (paymentMethod === "card") {
      try {
        const session = await apiService.startBachsCheckout({ order_id: order.id, guest_token: guestToken });
        try {
          localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({ orderId: order.id, guestToken }));
        } catch {}
        window.location.href = session.checkout_url; // the cart is cleared when they come back paid
        return;
      } catch (e: any) {
        // Payment couldn't start: cancel the unpaid order so it never reaches the store; the cart stays.
        const cancel = guestToken
          ? apiService.cancelGuestOrder(order.id, guestToken, "Card payment not started")
          : cancelOrder(order.id, "Card payment not started");
        cancel.catch(() => {});
        return fail(`${e.message || "Couldn't start payment."} Your cart is still here — try again or pay on delivery.`);
      }
    }

    if (guestToken) {
      clearCart();
      router.push(guestTrackingPath(order.id, guestToken));
      return;
    }
    finish(order);
  };

  const estimate = {
    subtotal: cartSubtotal,
    delivery_fee: cartDeliveryFee,
    service_fee: 0,
    discount: 0,
    tip,
    total: cartSubtotal + cartDeliveryFee + tip,
  };

  return {
    cart,
    address,
    setAddress,
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    contactEmail,
    setContactEmail,
    paymentMethod,
    setPaymentMethod,
    tip,
    setTip,
    promoInput,
    setPromoInput,
    promoCode,
    applyPromo,
    removePromo,
    /** Server quote (signed in or guest); a clearly-labelled estimate until it loads. */
    summary: quote || estimate,
    isQuote: !!quote,
    quoteLoading,
    isAuthenticated,
    error,
    notice,
    isSubmitting,
    submit,
  };
}
