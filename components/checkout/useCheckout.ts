"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";
import { CheckoutQuote, useOrderLines, useOrderQuote } from "@/components/checkout/useOrderQuote";

export type { CheckoutQuote };
import { guestTrackingPath, saveGuestOrder } from "@/utils/guestOrders";

export type PaymentMethod = "card" | "cash" | "transfer";


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
  const { cart, cartSubtotal, currentUser, isAuthenticated, userLocationAddress, userLocationCoords, userLocationDetails, hasPickedLocation, setUserLocation, placeOrder, cancelOrder, clearCart, stores } =
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

  // The delivery address is the map-picked location plus the customer's house number / landmark.
  const address = [userLocationDetails, userLocationAddress].map((p) => (p || "").trim()).filter(Boolean).join(", ");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [tip, setTip] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const lines = useOrderLines();
  const baseRequest = () => ({
    store_id: lines.storeId,
    items: lines.items,
    tip,
    promo_code: promoCode || undefined,
    ...lines.coords,
  });

  // Same server quote the cart shows, plus this screen's tip and promo.
  const { quote, loading: quoteLoading, error: quoteError } = useOrderQuote({ tip, promoCode });
  useEffect(() => {
    if (quoteError) setError(quoteError);
  }, [quoteError]);
  useEffect(() => {
    if (promoCode && quote?.promo_valid === false) {
      setNotice(quote.promo_message || `Promo code ${promoCode} can't be used on this order.`);
      setPromoCode(null);
    }
  }, [quote, promoCode]);

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
    const deliveryAddress = address.trim();
    if (!hasPickedLocation || !userLocationCoords || deliveryAddress.length < 5) {
      return setError("Set your delivery location on the map so the rider can find you.");
    }
    if (contactName.trim().length < 2) return setError("Please enter your name.");
    if (phoneDigits(contactPhone).length < 10) return setError("Please enter a phone number the rider can call.");
    if (contactEmail.trim() && !EMAIL_RE.test(contactEmail.trim())) return setError("That email address doesn't look right.");
    if (paymentMethod === "card" && !contactEmail.trim()) {
      return setError("Add your email to pay online. Your receipt goes there.");
    }

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
    delivery_fee: 0,
    service_fee: 0,
    discount: 0,
    tip,
    total: cartSubtotal + tip, // fees appear once the server quote arrives
  };

  return {
    cart,
    address,
    hasPickedLocation,
    locationTitle: userLocationAddress,
    locationDetails: userLocationDetails,
    locationCoords: userLocationCoords,
    setLocation: setUserLocation,
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
