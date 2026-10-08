import { Store, Product, Order, OrderStatus, RiderProfile, PlatformAnalytics, Review } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://novobackend.onrender.com/api/v1";

// Helper for authorized headers
const getAuthHeaders = (token?: string) => {
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : "");
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
};

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
  }) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");
    return data;
  },

  login: async (payload: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");
    return data;
  },

  verifyOtp: async (payload: { email: string; token: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "OTP verification failed");
    return data;
  },

  getMe: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to fetch auth details");
    return data;
  },

  // 2. USERS PROFILE MODULE (/api/v1/users)
  getUserProfile: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to fetch profile");
    return data;
  },

  updateUserProfile: async (payload: { full_name?: string; phone?: string }, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update profile");
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
    if (!res.ok) throw new Error(data.detail || "Avatar upload failed");
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
    if (!res.ok) throw new Error(data.detail || "Failed to add address");
    return data.data || data;
  },

  setDefaultAddress: async (addressId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/addresses/${addressId}/default`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to set default address");
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
    if (!res.ok) throw new Error(data.detail || "Failed to register merchant");
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
    if (!res.ok) throw new Error(data.detail || "Failed to create store");
    return data;
  },

  updateStore: async (storeId: string, payload: Partial<Store> & Record<string, any>, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update store");
    return data;
  },

  toggleStoreOpenStatus: async (storeId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/stores/${storeId}/toggle-open`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    return await res.json();
  },

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
    if (!res.ok) throw new Error(data.detail || "Failed to create product");
    return data.data ? apiService.normalizeProduct(data.data) : data;
  },

  updateProduct: async (productId: string, payload: Partial<Product>, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update product");
    return data.data ? apiService.normalizeProduct(data.data) : data;
  },

  toggleProductStock: async (productId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/toggle-stock`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to toggle product stock");
    return data;
  },

  deleteProduct: async (productId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to delete product");
    return data;
  },

  // 7. CART MODULE (/api/v1/carts)
  getCartSession: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/carts/`, {
      headers: getAuthHeaders(token),
    });
    if (res.ok) {
      const result = await res.json();
      return result.data || result;
    }
    return null;
  },

  addToCartSession: async (productId: string, quantity: number, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/carts/items?product_id=${productId}&quantity=${quantity}`, {
      method: "POST",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to add item to cart");
    return data;
  },

  clearCartSession: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/carts/`, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    return await res.json();
  },

  // 8. ORDERS MODULE (/api/v1/orders)
  normalizeOrder: (raw: any): Order => {
    if (!raw) return raw;
    const statusStr = (raw.status || "PENDING").toLowerCase();
    let mappedStatus = statusStr;
    if (statusStr === "pending") mappedStatus = "pending_merchant";
    if (statusStr === "confirmed") mappedStatus = "preparing";
    if (statusStr === "dispatched") mappedStatus = "out_for_delivery";

    return {
      id: raw.id || `ORD-${Date.now()}`,
      customerId: raw.customer_id || raw.customerId || "usr-me",
      customerName: raw.customer_name || raw.customerName || "Customer",
      customerPhone: raw.customer_phone || raw.customerPhone || "",
      deliveryAddress: raw.delivery_address || raw.deliveryAddress || "Standard Address",
      storeId: raw.store_id || raw.storeId || "",
      storeName: raw.store_name || raw.storeName || "Merchant Store",
      storeAddress: raw.store_address || raw.storeAddress || "",
      items: Array.isArray(raw.items) ? raw.items : [],
      subtotal: raw.subtotal || 0,
      deliveryFee: raw.delivery_fee || raw.deliveryFee || 0,
      serviceFee: raw.service_fee || raw.serviceFee || 0,
      tip: raw.tip || 0,
      total: raw.total || raw.total_amount || 0,
      status: mappedStatus as OrderStatus,
      paymentMethod: raw.payment_method || raw.paymentMethod || "card",
      paymentStatus: raw.payment_status || raw.paymentStatus || "pending",
      pickupCode: raw.pickup_code || raw.pickupCode || "1234",
      estimatedDeliveryMinutes: raw.estimated_delivery_minutes || raw.estimatedDeliveryMinutes || 25,
      riderId: raw.rider_id || raw.riderId,
      riderName: raw.rider_name || raw.riderName,
      riderPhone: raw.rider_phone || raw.riderPhone,
      riderPhoto: raw.rider_photo || raw.riderPhoto,
      createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    };
  },

  getOrders: async (storeId?: string, token?: string): Promise<Order[]> => {
    try {
      const url = storeId
        ? `${API_BASE_URL}/orders?store_id=${storeId}`
        : `${API_BASE_URL}/orders`;
      const res = await fetch(url, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        const data = result.data || result;
        if (Array.isArray(data)) {
          return data.map((o) => apiService.normalizeOrder(o));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch orders from backend API:", e);
    }
    return [];
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

  createOrder: async (payload: any, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to place order");
    const created = data.data || data;
    return apiService.normalizeOrder(created);
  },

  updateOrderStatus: async (orderId: string, status: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status?status=${status}`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (data.data) {
      return apiService.normalizeOrder(data.data);
    }
    return data;
  },

  cancelOrder: async (orderId: string, reason: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ reason }),
    });
    return await res.json();
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
    if (!res.ok) throw new Error(data.detail || "Payment initialization failed");
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
    if (!res.ok) throw new Error(data.detail || "Recording transaction failed");
    return data;
  },

  verifyPayment: async (reference: string) => {
    const res = await fetch(`${API_BASE_URL}/payments/verify/${reference}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Payment verification failed");
    return data.data || data;
  },

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
    if (!res.ok) throw new Error(data.detail || "Payout request failed");
    return data;
  },

  // 10.1 BACHS PAYMENT GATEWAY & SUBACCOUNTS (/api/v1/payments/bachs)
  createBachsCheckoutSession: async (payload: { order_id: string; amount: number; email?: string; splits?: any[] }, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/payments/bachs/checkout`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Bachs checkout creation failed");
    return data;
  },

  createBachsVendorSubaccount: async (payload: { business_name: string; bank_code: string; account_number: string; contact_email?: string }, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/payments/bachs/subaccount`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Bachs subaccount creation failed");
    return data;
  },

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
  getRiders: async (): Promise<RiderProfile[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/riders/`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn("Failed to fetch riders from backend API:", e);
    }
    return [];
  },

  toggleRiderOnlineStatus: async (token?: string) => {
    const res = await fetch(`${API_BASE_URL}/riders/me/status`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    return await res.json();
  },

  // 13. FILE UPLOADS & IMAGES MODULE (/api/v1/uploads)
  uploadSingleImage: async (formData: FormData, token?: string) => {
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : "");
    const res = await fetch(`${API_BASE_URL}/uploads/`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Image upload failed");
    return data;
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
    if (!res.ok) throw new Error(data.detail || "CSV Inventory import failed");
    return data;
  },

  // 15. RIDERS & ADMIN MANAGEMENT MODULE
  deactivateRider: async (riderId: string, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/riders/${riderId}/deactivate`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Deactivating rider failed");
    return data;
  },

  toggleMerchantStatus: async (merchantId: string, is_active: boolean, token?: string) => {
    const res = await fetch(`${API_BASE_URL}/merchants/${merchantId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ is_active }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Toggling merchant status failed");
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
    if (!res.ok) throw new Error(data.detail || "Pricing calculation failed");
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
    if (!res.ok) throw new Error(data.detail || "Promo code validation failed");
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
