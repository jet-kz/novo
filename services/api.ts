import {
  Store, Product, Order, OrderStatus, RiderProfile, PlatformAnalytics, Review,
  PlatformCategory, HomeCollection, MenuSection, AppNotification, PromoBanner,
  StorePromo, StorePromoRules, CatalogKind, CsvImportResult,
  MyPayouts, PayoutAccountView, PayoutsOverview, AdminUserRow,
} from "@/types";
import { shrinkImageForUpload } from "@/utils/imageUpload";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://novobackend.onrender.com/api/v1";

export function extractApiError(data: any, fallback: string) {
  const detail = data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || item?.detail || JSON.stringify(item)).join("; ");
  }
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

const getAuthHeaders = (token?: string) => {
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : "");
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
};

/** {latitude, longitude} from the API -> {lat, lon}, or null. */
const toPoint = (p: any) =>
  p && p.latitude != null && p.longitude != null ? { lat: Number(p.latitude), lon: Number(p.longitude) } : null;

/** JSON request that unwraps `{ data }` and throws an Error carrying the server's message on failure. */
async function request<T = any>(path: string, init: RequestInit & { token?: string } = {}, fallback = "Request failed"): Promise<T> {
  const { token, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers: { ...getAuthHeaders(token), ...(headers || {}) } });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) throw new Error(extractApiError(data, fallback));
  return (data && typeof data === "object" && "data" in data ? data.data : data) as T;
}

/** Backend lifecycle (UPPER_CASE) -> frontend OrderStatus. Keep in sync with app/modules/orders/status.py. */
export const ORDER_STATUS_FROM_API: Record<string, OrderStatus> = {
  CART: "pending_merchant",
  PENDING: "pending_merchant",
  PLACED: "pending_merchant",
  CONFIRMED: "accepted",
  PREPARING: "preparing",
  READY_FOR_PICKUP: "ready_for_pickup",
  RIDER_ASSIGNED: "rider_assigned",
  PICKED_UP: "picked_up",
  DISPATCHED: "picked_up",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  FAILED: "cancelled",
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending_merchant",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "picked_up",
];

// INITIAL SEED STORES (Clean fallback)
export const INITIAL_STORES: Store[] = [];

// INITIAL SEED PRODUCTS
export const INITIAL_PRODUCTS: Product[] = [];

// INITIAL RIDERS
export const INITIAL_RIDERS: RiderProfile[] = [];

// INITIAL ORDERS
export const INITIAL_ORDERS: Order[] = [];

// COMPLETE NOVO MODULAR MONOLITH BACKEND INTEGRATED API SERVICE
export const apiService = {
  // 1. AUTHENTICATION MODULE (/api/v1/auth)
  signUp: async (payload: {
    email: string;
    password: string;
    full_name?: string;
    role?: string;
    phone?: string;
    vehicle_type?: string;
    vehicle_plate?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Registration failed"));
    return data;
  },

  login: async (payload: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Login failed"));
    return data;
  },

  /** Pass the password to be signed in straight after verifying; the response then carries access_token. */
  verifyOtp: (payload: { email: string; token: string; password?: string }) =>
    request<{ access_token: string | null; user?: { id: string; email: string } }>(
      "/auth/verify-otp",
      { method: "POST", body: JSON.stringify(payload) },
      "Verification failed"
    ),

  resendOtp: (email: string, purpose: "signup" | "reset" = "signup") =>
    request<{ message: string }>(
      "/auth/resend-otp",
      { method: "POST", body: JSON.stringify({ email, purpose }) },
      "Couldn't resend the code"
    ),

  forgotPassword: (email: string) =>
    request<{ message: string }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
      "Couldn't send the reset code"
    ),

  resetPassword: (payload: { email: string; token: string; new_password: string }) =>
    request<{ message: string; access_token: string | null }>(
      "/auth/reset-password",
      { method: "POST", body: JSON.stringify(payload) },
      "Couldn't reset your password"
    ),

  getMe: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to fetch auth details"));
    return data.data || data;
  },

  // 2. USERS PROFILE MODULE (/api/v1/users)
  getUserProfile: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to fetch profile"));
    return data;
  },

  updateUserProfile: async (payload: { full_name?: string; phone?: string }, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to update profile"));
    return data;
  },

  uploadUserAvatar: async (formData: FormData, token?: string) => {
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : "");
    const res = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Avatar upload failed"));
    return data;
  },

  // 3. ADDRESSES MODULE (/api/v1/addresses)
  getAddresses: async (token?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        return result.data || result;
      }
    } catch (e) {
      console.warn("Error fetching addresses from backend:", e);
    }
    return [];
  },

  createAddress: async (
    payload: { title?: string; address: string; city?: string; state?: string; is_default?: boolean },
    token?: string
  ) => {
    const res = await fetch(`${API_BASE_URL}/addresses`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to add address"));
    return data.data || data;
  },

  setDefaultAddress: async (addressId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/addresses/${addressId}/default`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to set default address"));
    return data.data || data;
  },

  deleteAddress: async (addressId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    return await res.json();
  },

  // 4. MERCHANTS MODULE (/api/v1/merchants)
  getMerchantMe: async (token?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/merchants/me`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        return result.data || result;
      }
    } catch (e) { }
    return null;
  },

  getMerchants: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/merchants`, {
      headers: getAuthHeaders(token),
    });
    if (res.ok) {
      const result = await res.json();
      return result.data || result;
    }
    return [];
  },

  createMerchant: async (payload: { name: string; owner_id?: string }, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/merchants`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to register merchant"));
    return data;
  },

  // 5. STORES MODULE (/api/v1/stores)
  getStores: async (token?: string): Promise<Store[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stores`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        const data = result.data || result;
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn("Failed to fetch stores from backend API:", e);
    }
    return [];
  },

  getStoreById: async (id: string, token?: string): Promise<Store | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stores/${id}`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        return result.data || result;
      }
    } catch (e) { }
    return null;
  },

  createStore: async (payload: Partial<Store>, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/stores`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to create store"));
    return data;
  },

  updateStore: async (storeId: string, payload: Partial<Store> & Record<string, any>, token?: string) =>
    request(`/stores/${storeId}`, { method: "PUT", body: JSON.stringify(payload), token }, "Failed to update store"),

  toggleStoreOpenStatus: async (storeId: string, token?: string) =>
    request(`/stores/${storeId}/toggle-open`, { method: "PATCH", token }, "Could not update store status"),

  verifyStore: async (storeId: string, isVerified = true, token?: string) =>
    request(`/stores/${storeId}/verify`, { method: "PATCH", body: JSON.stringify({ is_verified: isVerified }), token }, "Could not update store approval"),

  // Helper: Normalize Backend Product to Frontend Product
  normalizeProduct: (p: any): Product => {
    if (!p) return p;
    return {
      ...p,
      storeId: p.store_id || p.storeId,
      inStock: p.in_stock !== undefined ? p.in_stock : (p.inStock !== undefined ? p.inStock : true),
      preparationTimeMinutes: p.preparation_time_minutes || p.preparationTimeMinutes || 20,
      proteinOptions: p.protein_options || p.proteinOptions || [],
      extrasOptions: p.extras_options || p.extrasOptions || [],
      optionGroups: p.option_groups || p.optionGroups || [],
      specs: p.specs || {},
    };
  },

  // 6. PRODUCTS MODULE (/api/v1/products)
  getProducts: async (storeId?: string, token?: string): Promise<Product[]> => {
    try {
      const url = storeId
        ? `${API_BASE_URL}/products?store_id=${storeId}`
        : `${API_BASE_URL}/products`;
      const res = await fetch(url, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        const data = result.data || result;
        if (Array.isArray(data)) {
          return data.map((item: any) => apiService.normalizeProduct(item));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch products from backend API:", e);
    }
    return [];
  },

  createProduct: async (payload: Partial<Product>, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to create product"));
    return data.data ? apiService.normalizeProduct(data.data) : data;
  },

  updateProduct: async (productId: string, payload: Partial<Product>, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to update product"));
    return data.data ? apiService.normalizeProduct(data.data) : data;
  },

  toggleProductStock: async (productId: string, token?: string) =>
    apiService.normalizeProduct(
      await request(`/products/${productId}/toggle-stock`, { method: "PATCH", token }, "Failed to toggle product stock")
    ),

  deleteProduct: async (productId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to delete product"));
    return data;
  },

  // 7. CART MODULE (/api/v1/carts)
  getCartSession: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/carts`, {
      headers: getAuthHeaders(token),
    });
    if (res.ok) {
      const result = await res.json();
      return result.data || result;
    }
    return null;
  },

  addToCartSession: async (
    productId: string,
    quantity: number,
    token?: string,
    extras?: { addons?: any }
  ) => {
    const res = await fetch(`${API_BASE_URL}/carts/items`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        product_id: productId,
        quantity,
        addons: extras?.addons,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to add item to cart"));
    return data.data || data;
  },

  updateCartItem: async (itemId: string, quantity: number, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/carts/items/${itemId}`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to update cart item"));
    return data.data || data;
  },

  removeCartItem: async (itemId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/carts/items/${itemId}`, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Failed to remove cart item"));
    return data.data || data;
  },

  clearCartSession: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/carts`, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    return await res.json();
  },

  // 8. ORDERS MODULE (/api/v1/orders)
  normalizeOrder: (raw: any): Order => {
    if (!raw) return raw;
    const apiStatus = String(raw.status || "PENDING").toUpperCase();
    const status = ORDER_STATUS_FROM_API[apiStatus] || (String(raw.status).toLowerCase() as OrderStatus);
    const items = Array.isArray(raw.items)
      ? raw.items.map((it: any) =>
          it?.product
            ? it
            : {
                product: {
                  id: it.product_id || it.id,
                  storeId: raw.store_id || "",
                  name: it.name || "Item",
                  description: "",
                  price: Number(it.price) || 0,
                  image: it.image || "",
                  category: "",
                  inStock: true,
                },
                quantity: Number(it.quantity) || 1,
                selectedOptions: Array.isArray(it.addons) ? it.addons : [],
                specialInstructions: it.note || undefined,
              }
        )
      : [];

    return {
      id: raw.id,
      customerId: raw.customer_id || raw.customerId || "",
      customerName: raw.customer_name || raw.customerName || "Customer",
      customerPhone: raw.customer_phone || raw.customerPhone || "",
      customerEmail: raw.customer_email || raw.customerEmail || undefined,
      isGuest: Boolean(raw.is_guest ?? raw.isGuest),
      deliveryAddress: raw.delivery_address || raw.deliveryAddress || "",
      customerNote: raw.customer_note || raw.customerNote || undefined,
      storeId: raw.store_id || raw.storeId || "",
      storeName: raw.store_name || raw.storeName || "",
      storeAddress: raw.store_address || raw.storeAddress || "",
      items,
      subtotal: Number(raw.subtotal) || 0,
      deliveryFee: Number(raw.delivery_fee ?? raw.deliveryFee) || 0,
      serviceFee: Number(raw.service_fee ?? raw.serviceFee) || 0,
      tip: Number(raw.tip) || 0,
      total: Number(raw.total ?? raw.total_amount) || 0,
      status,
      paymentMethod: raw.payment_method || raw.paymentMethod || "card",
      paymentStatus: raw.payment_status === "paid" || raw.paymentStatus === "paid" ? "paid" : raw.payment_status === "failed" ? "failed" : "pending",
      pickupCode: raw.pickup_code || raw.pickupCode,
      deliveryCode: raw.delivery_code || raw.deliveryCode,
      etaMinutes: raw.eta_minutes != null ? Number(raw.eta_minutes) : undefined,
      storeLocation: toPoint(raw.store_location),
      dropoffLocation: toPoint(raw.dropoff_location),
      riderLocation: raw.rider_location ? { ...toPoint(raw.rider_location)!, updatedAt: raw.rider_location.updated_at } : null,
      estimatedDeliveryMinutes: raw.estimated_delivery_minutes || raw.estimatedDeliveryMinutes || 30,
      riderId: raw.rider_id || raw.riderId,
      riderName: raw.rider_name || raw.riderName,
      riderPhone: raw.rider_phone || raw.riderPhone,
      riderPhoto: raw.rider_photo || raw.riderPhoto,
      riderEarnings: raw.rider_earnings != null ? Number(raw.rider_earnings) : undefined,
      createdAt: raw.created_at || raw.createdAt || "",
      updatedAt: raw.updated_at || raw.updatedAt || raw.created_at || "",
    };
  },

  getOrders: async (storeId?: string, token?: string): Promise<Order[]> => {
    const data = await request<any[]>(storeId ? `/orders?store_id=${encodeURIComponent(storeId)}` : "/orders", { token }, "Could not load orders");
    return Array.isArray(data) ? data.map((o) => apiService.normalizeOrder(o)) : [];
  },

  getOrderById: async (orderId: string, token?: string): Promise<Order | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        const data = result.data || result;
        return apiService.normalizeOrder(data);
      }
    } catch (e) { }
    return null;
  },

  getOrderHistory: async (orderId: string, token?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/history`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        return result.data || result;
      }
    } catch (e) { }
    return [];
  },

  quoteOrder: async (payload: any, token?: string) =>
    request<{
      subtotal: number;
      delivery_fee: number;
      service_fee: number;
      discount: number;
      tip: number;
      total: number;
      distance_km: number;
      applied_promo_code: string | null;
      promo_valid: boolean | null;
    }>("/orders/quote", { method: "POST", body: JSON.stringify(payload), token }, "Could not price your order"),

  createOrder: async (payload: any, token?: string) => {
    const created = await request("/orders", { method: "POST", body: JSON.stringify(payload), token }, "Failed to place order");
    return apiService.normalizeOrder(created);
  },

  /** extra carries e.g. { pickup_code } for rider pickup or { reason } for cancellation. */
  updateOrderStatus: async (orderId: string, status: string, token?: string, extra?: Record<string, any>) => {
    const updated = await request(
      `/orders/${encodeURIComponent(orderId)}/status`,
      { method: "PATCH", body: JSON.stringify({ status, ...(extra || {}) }), token },
      "Failed to update order status"
    );
    return apiService.normalizeOrder(updated);
  },

  cancelOrder: async (orderId: string, reason: string, token?: string) => {
    const updated = await request(
      `/orders/${encodeURIComponent(orderId)}/cancel`,
      { method: "POST", body: JSON.stringify({ reason }), token },
      "Could not cancel order"
    );
    return apiService.normalizeOrder(updated);
  },

  // 9. PAYMENTS MODULE (/api/v1/payments)
  getPaymentForOrder: async (orderId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/payments/${orderId}`, {
      headers: getAuthHeaders(token),
    });
    if (res.ok) {
      const result = await res.json();
      return result.data || result;
    }
    return null;
  },

  initiatePayment: async (payload: { order_id: string; amount: number; payment_method: string }, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Payment initialization failed"));
    return data;
  },

  recordPaymentTransaction: async (
    paymentId: string,
    payload: { provider_tx_id?: string; amount: number; currency?: string; status: string; raw_response?: any },
    token?: string
  ) => {
    const res = await fetch(`${API_BASE_URL}/payments/${paymentId}/transactions`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Recording transaction failed"));
    return data;
  },

  verifyPayment: async (reference: string, token?: string) =>
    request<{ verified: boolean; status: string; message?: string; order_id?: string }>(
      `/payments/verify/${encodeURIComponent(reference)}`,
      { token },
      "Payment verification failed"
    ),

  // 10. WALLETS MODULE (/api/v1/wallets)
  getWallets: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/wallets`, {
      headers: getAuthHeaders(token),
    });
    if (res.ok) {
      const result = await res.json();
      return result.data || result;
    }
    return [];
  },

  getWalletBalance: async (currency = "NGN", token?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/wallets/${currency}/balance`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        return result.data || result;
      }
    } catch (e) { }
    return { balance: 0, currency };
  },

  getWalletTransactions: async (currency = "NGN", token?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/wallets/${currency}/transactions`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        return result.data || result;
      }
    } catch (e) { }
    return [];
  },

  requestPayoutDebit: async (payload: { amount: number; currency?: string; description?: string }, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/wallets/debit`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        currency: payload.currency || "NGN",
        amount: payload.amount,
        description: payload.description || "Merchant wallet payout request",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Payout request failed"));
    return data;
  },

  // 10.1 BACHS HOSTED CHECKOUT (/api/v1/payments/bachs). Amount always comes from the order on the server.
  /** Returns { checkout_url } to redirect to. Guests pass the guest_token from checkout. */
  startBachsCheckout: (payload: { order_id: string; guest_token?: string }) =>
    request<{ checkout_id: string; checkout_url: string; expires_at?: string }>(
      "/payments/bachs/checkout",
      { method: "POST", body: JSON.stringify(payload) },
      "Couldn't start payment"
    ),

  /** After returning from Bachs: records the payment if complete. Returns the order's payment_status. */
  confirmBachsCheckout: (payload: { order_id: string; checkout_id?: string; guest_token?: string }) =>
    request<{ order_id: string; payment_status: string }>(
      "/payments/bachs/confirm",
      { method: "POST", body: JSON.stringify(payload) },
      "Couldn't check payment"
    ),

  // 10.1b PAYOUTS (/api/v1/payouts) — merchants & riders get paid through Bachs connected accounts.
  getPayoutBanks: () => request<{ code: string; name: string }[]>("/payouts/banks", {}, "Could not load banks"),
  getMyPayouts: () => request<MyPayouts>("/payouts/me", {}, "Could not load your payouts"),
  savePayoutAccount: (payload: {
    bank_code: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    first_name: string;
    last_name: string;
    entity_type?: "individual" | "company";
  }) => request<PayoutAccountView>("/payouts/me/account", { method: "POST", body: JSON.stringify(payload) }, "Could not save bank details"),
  getPayoutVerificationLink: () =>
    request<{ url: string }>("/payouts/me/verification-link", { method: "POST" }, "Could not open verification"),
  withdrawPayout: (amount?: number) =>
    request("/payouts/me/withdraw", { method: "POST", body: JSON.stringify(amount ? { amount } : {}) }, "Withdrawal failed"),
  getPayoutsOverview: () => request<PayoutsOverview>("/payouts/admin/overview", {}, "Could not load settlements"),
  settlePayee: (payload: { payee_type: "merchant" | "rider"; payee_id: string; amount: number; note?: string }) =>
    request("/payouts/admin/settle", { method: "POST", body: JSON.stringify(payload) }, "Settlement failed"),

  // 10.1c ADMIN CONSOLE (/api/v1/admin)
  adminOverview: () => request<any>("/admin/overview", {}, "Could not load overview"),
  adminUsers: (params: { q?: string; role?: string; status?: string; limit?: number; offset?: number } = {}) =>
    request<{ total: number; items: AdminUserRow[] }>(
      `/admin/users?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]))}`,
      {},
      "Could not load users"
    ),
  suspendUser: (id: string, reason?: string) =>
    request(`/admin/users/${id}/suspend`, { method: "POST", body: JSON.stringify({ reason }) }, "Could not suspend account"),
  reactivateUser: (id: string) => request(`/admin/users/${id}/reactivate`, { method: "POST" }, "Could not reactivate account"),
  sendUserPasswordReset: (id: string) =>
    request<any>(`/admin/users/${id}/password-reset`, { method: "POST" }, "Could not send reset code"),
  setUserAdmin: (id: string, grant: boolean) =>
    request(`/admin/users/${id}/admin`, { method: "PUT", body: JSON.stringify({ grant }) }, "Could not update admin access"),
  inviteAdmin: (email: string, full_name: string) =>
    request<any>("/admin/admins", { method: "POST", body: JSON.stringify({ email, full_name }) }, "Could not add admin"),
  adminOrders: (params: { view?: string; q?: string; limit?: number; offset?: number } = {}) =>
    request<{ total: number; items: any[] }>(
      `/admin/orders?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]))}`,
      {},
      "Could not load orders"
    ),
  adminOrder: (id: string) => request<any>(`/admin/orders/${encodeURIComponent(id)}`, {}, "Could not load order"),
  recordRefund: (id: string, reference: string, note?: string) =>
    request<any>(`/admin/orders/${encodeURIComponent(id)}/refund`, { method: "POST", body: JSON.stringify({ reference, note }) }, "Could not record refund"),
  adminMerchants: () => request<any[]>("/admin/merchants", {}, "Could not load merchants"),
  adminPayments: (offset = 0) => request<any>(`/admin/payments?offset=${offset}`, {}, "Could not load payments"),
  adminActivity: (offset = 0) => request<any>(`/admin/activity?offset=${offset}`, {}, "Could not load activity"),
  changePassword: (current_password: string, new_password: string) =>
    request("/auth/change-password", { method: "POST", body: JSON.stringify({ current_password, new_password }) }, "Could not change password"),

  // 10.2 GUEST CHECKOUT (/api/v1/orders/guest) — no account needed; the token is the guest's key.
  quoteGuestOrder: (payload: any) =>
    request<any>("/orders/guest/quote", { method: "POST", body: JSON.stringify(payload) }, "Could not price your order"),

  createGuestOrder: async (payload: any): Promise<{ order: Order; guestToken: string }> => {
    const created = await request<any>("/orders/guest", { method: "POST", body: JSON.stringify(payload) }, "Failed to place order");
    return { order: apiService.normalizeOrder(created), guestToken: created.guest_token };
  },

  getGuestOrder: async (orderId: string, token: string): Promise<Order & { history: any[] }> => {
    const raw = await request<any>(
      `/orders/guest/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`,
      {},
      "We couldn't find that order"
    );
    return { ...apiService.normalizeOrder(raw), history: Array.isArray(raw.history) ? raw.history : [] };
  },

  cancelGuestOrder: async (orderId: string, token: string, reason: string) =>
    apiService.normalizeOrder(
      await request(
        `/orders/guest/${encodeURIComponent(orderId)}/cancel`,
        { method: "POST", body: JSON.stringify({ token, reason }) },
        "Could not cancel order"
      )
    ),

  // 10.3 HOMEPAGE CATALOG (/api/v1/catalog) — public reads, admin writes.
  getPlatformCategories: (includeInactive = false) =>
    request<PlatformCategory[]>(`/catalog/categories${includeInactive ? "?include_inactive=true" : ""}`, {}, "Could not load categories"),
  createPlatformCategory: (payload: Partial<PlatformCategory>) =>
    request<PlatformCategory>("/catalog/categories", { method: "POST", body: JSON.stringify(payload) }, "Could not create category"),
  updatePlatformCategory: (id: string, payload: Partial<PlatformCategory>) =>
    request<PlatformCategory>(`/catalog/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, "Could not save category"),
  deletePlatformCategory: (id: string) =>
    request(`/catalog/categories/${id}`, { method: "DELETE" }, "Could not delete category"),
  getHomeCollections: (includeInactive = false) =>
    request<HomeCollection[]>(`/catalog/collections${includeInactive ? "?include_inactive=true" : ""}`, {}, "Could not load collections"),
  createHomeCollection: (payload: Partial<HomeCollection>) =>
    request<HomeCollection>("/catalog/collections", { method: "POST", body: JSON.stringify(payload) }, "Could not create collection"),
  updateHomeCollection: (id: string, payload: Partial<HomeCollection>) =>
    request<HomeCollection>(`/catalog/collections/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, "Could not save collection"),
  deleteHomeCollection: (id: string) =>
    request(`/catalog/collections/${id}`, { method: "DELETE" }, "Could not delete collection"),

  // 10.3a STORE PROMO CODES (merchant-run, merchant-funded)
  getStorePromoRules: () => request<StorePromoRules>("/pricing/merchant-promo-rules", {}, "Could not load promo rules"),
  getMyPromotions: () => request<StorePromo[]>("/pricing/my-promotions", {}, "Could not load your promotions"),
  createMyPromotion: (payload: Partial<StorePromo>) =>
    request<StorePromo>("/pricing/my-promotions", { method: "POST", body: JSON.stringify(payload) }, "Could not create promotion"),
  updateMyPromotion: (id: string, payload: Partial<StorePromo>) =>
    request<StorePromo>(`/pricing/my-promotions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, "Could not update promotion"),
  deleteMyPromotion: (id: string) =>
    request<{ result: "deleted" | "archived" }>(`/pricing/my-promotions/${id}`, { method: "DELETE" }, "Could not delete promotion"),
  adminSetPromotionActive: (id: string, is_active: boolean) =>
    request(`/pricing/promotions/${id}`, { method: "PATCH", body: JSON.stringify({ is_active }) }, "Could not update promotion"),
  adminDeletePromotion: (id: string) =>
    request<{ result: "deleted" | "archived" }>(`/pricing/promotions/${id}`, { method: "DELETE" }, "Could not delete promotion"),

  // 10.3c MENU SPREADSHEETS
  /** Downloads a CSV (template or the store's current items) and saves it with its server filename. */
  downloadCatalogCsv: async (kind: CatalogKind, storeId?: string) => {
    const path = storeId
      ? `/products/csv/export?store_id=${encodeURIComponent(storeId)}&kind=${kind}`
      : `/products/csv/template?kind=${kind}`;
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${path}`, { headers: getAuthHeaders() });
    } catch {
      throw new Error("Can't reach the server. Check your connection and try again.");
    }
    if (!res.ok) throw new Error(extractApiError(await res.json().catch(() => ({})), "Could not download the file"));
    const blob = await res.blob();
    const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") || "")?.[1] || `novo-${kind}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  importCatalogCsv: (storeId: string, payload: { csv: string; kind: CatalogKind; dry_run: boolean; skip_invalid?: boolean }) =>
    request<CsvImportResult>(
      `/products/csv/import?store_id=${encodeURIComponent(storeId)}`,
      { method: "POST", body: JSON.stringify(payload) },
      "Could not import the file"
    ),

  // 10.3b PROMO BANNERS (homepage ad carousel)
  getBanners: (placement: "home" | "shop" | "all" = "home", includeInactive = false) =>
    request<PromoBanner[]>(
      `/catalog/banners?placement=${placement}${includeInactive ? "&include_inactive=true" : ""}`,
      {},
      "Could not load banners"
    ),
  createBanner: (payload: Partial<PromoBanner>) =>
    request<PromoBanner>("/catalog/banners", { method: "POST", body: JSON.stringify(payload) }, "Could not create banner"),
  updateBanner: (id: string, payload: Partial<PromoBanner>) =>
    request<PromoBanner>(`/catalog/banners/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, "Could not save banner"),
  deleteBanner: (id: string) => request(`/catalog/banners/${id}`, { method: "DELETE" }, "Could not delete banner"),
  reorderBanners: (ids: string[]) =>
    request("/catalog/banners/reorder", { method: "POST", body: JSON.stringify({ ids }) }, "Could not reorder banners"),

  // 10.4 MENU SECTIONS (per-store product categories)
  getMenuSections: (storeId: string) =>
    request<MenuSection[]>(`/products/categories?store_id=${encodeURIComponent(storeId)}`, {}, "Could not load menu sections"),
  createMenuSection: (storeId: string, name: string) =>
    request<MenuSection>("/products/categories", { method: "POST", body: JSON.stringify({ store_id: storeId, name }) }, "Could not add section"),
  renameMenuSection: (id: string, name: string) =>
    request<MenuSection>(`/products/categories/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }, "Could not rename section"),
  deleteMenuSection: (id: string) => request(`/products/categories/${id}`, { method: "DELETE" }, "Could not remove section"),
  reorderMenuSections: (storeId: string, ids: string[]) =>
    request<MenuSection[]>("/products/categories/reorder", { method: "PUT", body: JSON.stringify({ store_id: storeId, ids }) }, "Could not reorder sections"),

  // 10.5 NOTIFICATIONS (in-app messages, e.g. admin -> rider)
  getMyNotifications: () =>
    request<{ items: AppNotification[]; unread: number }>("/notifications/me", {}, "Could not load messages"),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: "POST" }, "Could not update message"),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }, "Could not update messages"),

  // 11. DELIVERIES & LOGISTICS MODULE (/api/v1/deliveries)
  getDeliveryByOrderId: async (orderId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/deliveries/order/${orderId}`, {
      headers: getAuthHeaders(token),
    });
    if (res.ok) return await res.json();
    return null;
  },

  updateDeliveryStatus: async (deliveryId: string, status: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/deliveries/${deliveryId}/status?status=${status}`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    return await res.json();
  },

  postRiderGpsLocation: async (payload: { latitude: number; longitude: number }, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/deliveries/rider/location`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // 12. RIDERS MODULE (/api/v1/riders)
  getRiders: async (token?: string): Promise<RiderProfile[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/riders`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        const result = data.data || data;
        if (Array.isArray(result)) return result;
      }
    } catch (e) {
      console.warn("Failed to fetch riders from backend API:", e);
    }
    return [];
  },

  getRiderMe: async (token?: string) => request("/riders/me", { token }, "Could not load rider profile"),

  updateRiderMe: (payload: { vehicle_type?: string; vehicle_plate?: string; id_document_path?: string }) =>
    request("/riders/me", { method: "PATCH", body: JSON.stringify(payload) }, "Could not save your details"),

  /** Admin: riders with onboarding status, email and phone. */
  getRidersForAdmin: (approvalStatus?: string) =>
    request<any[]>(`/riders${approvalStatus ? `?approval_status=${approvalStatus}` : ""}`, {}, "Could not load riders"),

  reviewRider: (riderId: string, decision: "approve" | "reject", note?: string) =>
    request(`/riders/${encodeURIComponent(riderId)}/review`, { method: "PATCH", body: JSON.stringify({ decision, note }) }, "Could not save review"),

  messageRider: (riderId: string, title: string, body: string) =>
    request(`/riders/${encodeURIComponent(riderId)}/message`, { method: "POST", body: JSON.stringify({ title, body }) }, "Could not send message"),

  broadcastToRiders: (payload: { title: string; body: string; audience: "approved" | "online" | "pending" | "all" }) =>
    request<{ sent: number }>("/riders/broadcast", { method: "POST", body: JSON.stringify(payload) }, "Could not send message"),

  setRiderOnlineStatus: async (status?: "online" | "offline", token?: string) =>
    request("/riders/me/status", { method: "PATCH", body: JSON.stringify(status ? { status } : {}), token }, "Could not change online status"),

  // 13. FILE UPLOADS & IMAGES MODULE (/api/v1/uploads)
  /** Upload an image to storage and return its public URL. */
  uploadImage: async (
    file: File,
    bucket: "avatars" | "store-logos" | "store-banners" | "product-images" | "promo-banners",
    folder = "",
    token?: string
  ): Promise<string> => {
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : "");
    const formData = new FormData();
    formData.append("file", await shrinkImageForUpload(file));
    const qs = new URLSearchParams({ bucket, ...(folder ? { folder } : {}) });
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/uploads?${qs}`, {
        method: "POST",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });
    } catch {
      throw new Error("Upload failed. Check your connection and try again.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(extractApiError(data, "Image upload failed"));
    const url = data?.data?.url;
    if (!url) throw new Error("Upload succeeded but no URL was returned");
    return url;
  },

  /** Rider ID photo into the private documents bucket. Returns the storage path to save on the profile. */
  uploadRiderDocument: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", await shrinkImageForUpload(file));
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/uploads?bucket=rider-documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
    } catch {
      throw new Error("Upload failed. Check your connection and try again.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(extractApiError(data, "Upload failed"));
    if (!data?.data?.path) throw new Error("Upload succeeded but no file path was returned");
    return data.data.path;
  },

  // 14. INVENTORY & CSV BULK IMPORT MODULE (/api/v1/inventory)
  importInventoryCSV: async (file: File, token?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : "");

    const res = await fetch(`${API_BASE_URL}/inventory/import`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "CSV Inventory import failed"));
    return data;
  },

  // 15. RIDERS & ADMIN MANAGEMENT MODULE
  deactivateRider: async (riderId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/riders/${riderId}/deactivate`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Deactivating rider failed"));
    return data;
  },

  toggleMerchantStatus: async (merchantId: string, is_active: boolean, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/merchants/${merchantId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ is_active }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Toggling merchant status failed"));
    return data;
  },

  getUsers: async (token?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        return result.data || result;
      }
    } catch (e) {
      console.warn("Failed to fetch users:", e);
    }
    return [];
  },

  // 16. ANALYTICS MODULE (/api/v1/analytics)
  getAnalytics: async (token?: string): Promise<PlatformAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        const data = result.data || result;
        if (data && typeof data === "object") return data;
      }
    } catch (e) {
      console.warn("Failed to fetch analytics from backend API:", e);
    }
    return {
      totalRevenue: 0,
      totalOrders: 0,
      activeStoresCount: 0,
      activeRidersCount: 0,
      totalCustomersCount: 0,
      gmvToday: 0,
      commissionEarned: 0,
    };
  },

  // 17. PRICING & PROMOTIONS ENGINE MODULE (/api/v1/pricing)
  calculatePricing: async (payload: {
    subtotal: number;
    merchant_id?: string;
    user_id?: string;
    promo_code?: string;
    distance_km?: number;
  }) => {
    const res = await fetch(`${API_BASE_URL}/pricing/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Pricing calculation failed"));
    return data;
  },

  validatePromoCode: async (payload: {
    code: string;
    subtotal: number;
    merchant_id?: string;
    user_id?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/pricing/validate-promo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractApiError(data, "Promo code validation failed"));
    return data;
  },

  getCommissionRules: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/pricing/rules/commission`, {
      headers: getAuthHeaders(token),
    });
    return res.ok ? await res.json() : [];
  },

  saveCommissionRule: async (payload: any, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/pricing/rules/commission`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  getDeliveryRules: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/pricing/rules/delivery`, {
      headers: getAuthHeaders(token),
    });
    return res.ok ? await res.json() : [];
  },

  saveDeliveryRule: async (payload: any, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/pricing/rules/delivery`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  getServiceFeeRules: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/pricing/rules/service-fee`, {
      headers: getAuthHeaders(token),
    });
    return res.ok ? await res.json() : [];
  },

  saveServiceFeeRule: async (payload: any, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/pricing/rules/service-fee`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  getPromotions: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/pricing/promotions`, {
      headers: getAuthHeaders(token),
    });
    return res.ok ? await res.json() : [];
  },

  createPromotion: async (payload: any, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/pricing/promotions`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },
};

export const api = apiService;
