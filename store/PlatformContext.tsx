"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  UserRole,
  User,
  Store,
  Product,
  CartItem,
  Order,
  OrderStatus,
  RiderProfile,
  PlatformAnalytics,
  Review,
} from "@/types";
import { apiService } from "@/services/api";
import { getUniqueStoreBanner, getUniqueStoreLogo } from "@/utils/storeImageUtils";
import { relinkPushIfGranted } from "@/utils/push";
import { cartLineKey, lineUnitPrice, needsChoices } from "@/utils/options";
import { Coordinates, isStoreInDeliveryRange, getCoordinatesForAddress } from "@/utils/locationUtils";

interface PlatformContextType {
  // Role & Auth State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User;
  isAuthenticated: boolean;
  authReady: boolean;
  loginUser: (token: string, email?: string, role?: UserRole) => void;
  logout: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  /** What's showing now. */
  theme: "light" | "dark";
  /** What the user picked; "system" follows the device. */
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;

  // Location & Geofencing
  userLocationAddress: string;
  userLocationCoords: Coordinates | null;
  userLocationDetails: string;
  /** False until the customer has chosen a location (we're still on the Warri default). */
  hasPickedLocation: boolean;
  setUserLocation: (address: string, coords?: Coordinates | null, details?: string) => void;
  getStoreDeliveryDetails: (store: Store) => { inRange: boolean; distanceKm: number; deliveryFee: number; deliveryTime: string };

  // Stores
  stores: Store[];
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  activeStore: Store;
  /** The store owned by the signed-in merchant, resolved from /merchants/me. */
  merchantStore: Store | null;
  merchantStoreLoading: boolean;
  refreshMerchantStore: () => Promise<void>;
  addStore: (store: Omit<Store, "id" | "rating" | "reviewCount" | "isVerified">) => Store;
  updateStore: (id: string, updates: Partial<Store>) => Promise<Store>;
  toggleStoreStatus: (id: string) => Promise<void>;

  // Products
  products: Product[];
  saveProduct: (product: Partial<Product>, id?: string) => Promise<Product>;
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStock: (id: string) => Promise<void>;
  /** Reload every product from the server (e.g. after a spreadsheet import). */
  refreshProducts: () => Promise<void>;

  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, selectedOptions?: any[], specialInstructions?: string) => boolean;
  /** Pass cartLineKey(item); a bare product id still works and hits every line of that product. */
  removeFromCart: (lineKey: string) => void;
  updateCartQuantity: (lineKey: string, quantity: number) => void;
  /** Opens the item sheet (photo, options, quantity). */
  openProduct: (product: Product) => void;
  closeProduct: () => void;
  viewingProduct: Product | null;
  clearCart: () => void;
  cartSubtotal: number;
  /** Estimate only — the checkout shows the server quote. */
  cartDeliveryFee: number;
  cartTotal: number;

  // Orders
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  refreshOrders: () => Promise<void>;
  activeOrder: Order | null;
  /** Record an order the server has already created and clear the cart. */
  placeOrder: (
    deliveryAddress: string,
    paymentMethod: "card" | "cash" | "transfer",
    tipAmount: number,
    existingBackendOrder?: any
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: Record<string, any>) => Promise<Order>;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order>;
  rateOrder: (orderId: string, storeRating: number, riderRating: number, comment: string) => void;

  // Rider State
  riderProfile: RiderProfile;
  refreshRider: () => Promise<void>;
  toggleRiderOnline: () => Promise<void>;
  acceptDeliveryJob: (orderId: string) => Promise<Order>;
  confirmPickup: (orderId: string, pickupCode: string) => Promise<Order>;
  completeDelivery: (orderId: string, deliveryCode: string) => Promise<Order>;
  reportDeliveryProblem: (orderId: string, reason: string) => Promise<Order>;

  // Admin Analytics
  analytics: PlatformAnalytics;
  approveStore: (storeId: string) => Promise<void>;
  verifyRider: (riderId: string) => void;

  // Reviews
  reviews: Review[];
}

export type ThemePreference = "system" | "light" | "dark";

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

const CART_STORAGE_KEY = "novo_cart_v1";
const LOCATION_STORAGE_KEY = "novo_delivery_location";
const ORDER_POLL_MS = 12_000;

const EMPTY_USER: User = { id: "", name: "", email: "", phone: "", role: "customer", address: "", createdAt: "" };

const EMPTY_RIDER: RiderProfile = {
  ...EMPTY_USER,
  role: "rider",
  avatar: "",
  isOnline: false,
  isVerified: false,
  verificationStatus: "pending",
  vehicleType: "motorcycle",
  vehiclePlate: "",
  rating: 5.0,
  totalDeliveries: 0,
  earningsToday: 0,
  earningsThisWeek: 0,
  tipsToday: 0,
};

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("access_token") || undefined : undefined);

export function normalizeStore(bs: any): Store {
  const settings = bs.settings && typeof bs.settings === "object" ? bs.settings : {};
  return {
    id: bs.id,
    merchantId: bs.merchant_id,
    name: bs.name,
    slug: bs.slug || (bs.name ? bs.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `store-${bs.id}`),
    description: settings.description || bs.description || `${bs.name} - Quality items & fast delivery`,
    category: (bs.store_type || "restaurant").toLowerCase() as Store["category"],
    address: bs.address || "",
    phone: bs.phone || "",
    rating: Number(bs.rating) || 0,
    reviewCount: bs.review_count || 0,
    isOpening: bs.is_open ?? true,
    isVerified: !!bs.is_verified,
    status: bs.is_verified ? "active" : "pending",
    latitude: bs.location?.latitude,
    longitude: bs.location?.longitude,
    banner: getUniqueStoreBanner({ id: bs.id, name: bs.name, category: bs.store_type, banner: bs.banner }),
    logo: getUniqueStoreLogo({ id: bs.id, name: bs.name, category: bs.store_type, logo: bs.logo }),
    deliveryFee: Number(settings.delivery_fee) || 450,
    deliveryTime: settings.delivery_time || "20-30 min",
    minOrder: Number(settings.min_order) || 0,
    cuisineType: bs.store_type || "Restaurant",
  };
}

function storeUpdatesToApi(updates: Partial<Store> & Record<string, any>) {
  const out: Record<string, any> = {};
  const direct = ["name", "address", "phone", "logo", "banner", "description"] as const;
  for (const key of direct) if (updates[key] !== undefined) out[key] = updates[key];
  if (updates.category !== undefined) out.store_type = updates.category;
  if (updates.isOpening !== undefined) out.is_open = updates.isOpening;
  if (updates.deliveryFee !== undefined) out.deliveryFee = updates.deliveryFee;
  if (updates.minOrder !== undefined) out.minOrder = updates.minOrder;
  if (updates.deliveryTime !== undefined) out.deliveryTime = updates.deliveryTime;
  if (updates.latitude !== undefined && updates.longitude !== undefined) {
    out.location = { latitude: updates.latitude, longitude: updates.longitude };
  }
  return out;
}

function riderFromApi(data: any, base: RiderProfile): RiderProfile {
  return {
    ...base,
    id: data.id || base.id,
    isOnline: data.status === "online" || data.status === "busy",
    vehicleType: data.vehicle_type || base.vehicleType,
    vehiclePlate: data.vehicle_plate || base.vehiclePlate,
    rating: data.rating || base.rating,
    totalDeliveries: data.total_deliveries ?? base.totalDeliveries,
    earningsToday: data.earnings_today ?? base.earningsToday,
    earningsThisWeek: data.earnings_this_week ?? base.earningsThisWeek,
    tipsToday: data.tips_today ?? base.tipsToday,
    approvalStatus: data.approval_status ?? base.approvalStatus,
    approvalNote: data.approval_note ?? null,
    idDocumentUrl: data.id_document_url ?? null,
    isVerified: data.approval_status ? data.approval_status === "approved" : base.isVerified,
    verificationStatus:
      data.approval_status === "approved" ? "verified" : data.approval_status === "rejected" ? "rejected" : data.approval_status ? "pending" : base.verificationStatus,
  };
}

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>("customer");
  const [currentUser, setCurrentUser] = useState<User>(EMPTY_USER);

  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>("");
  const [merchantStore, setMerchantStore] = useState<Store | null>(null);
  const [merchantStoreLoading, setMerchantStoreLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [riderProfile, setRiderProfile] = useState<RiderProfile>(EMPTY_RIDER);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [userLocationAddress, setUserLocationAddress] = useState<string>("Warri, Delta State");
  const [userLocationCoords, setUserLocationCoords] = useState<Coordinates | null>({ lat: 5.5544, lon: 5.7932 });

  // House/flat number or landmark the rider needs, kept separate from the map address.
  const [userLocationDetails, setUserLocationDetails] = useState<string>("");
  const [hasPickedLocation, setHasPickedLocation] = useState(false);

  const setUserLocation = (address: string, coords?: Coordinates | null, details?: string) => {
    const resolved = coords || getCoordinatesForAddress(address);
    setUserLocationAddress(address);
    setUserLocationCoords(resolved);
    if (details !== undefined) setUserLocationDetails(details);
    setHasPickedLocation(true);
    try {
      localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify({ address, coords: resolved, details: details ?? userLocationDetails })
      );
    } catch {}
  };

  // Restore the last delivery location on this device.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY) || "null");
      if (saved?.address && saved?.coords?.lat != null) {
        setUserLocationAddress(saved.address);
        setUserLocationCoords(saved.coords);
        setUserLocationDetails(saved.details || "");
        setHasPickedLocation(true);
      }
    } catch {}
  }, []);

  const getStoreDeliveryDetails = (store: Store) => isStoreInDeliveryRange(store, userLocationAddress, userLocationCoords);

  const [favorites, setFavorites] = useState<string[]>([]);
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Theme: "system" (default) follows the phone/computer; "light"/"dark" are the user's choice.
  // The inline script in app/layout.tsx applies it before first paint.
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [systemDark, setSystemDark] = useState(false);
  const theme: "light" | "dark" = themePreference === "system" ? (systemDark ? "dark" : "light") : themePreference;

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      if (pref === "system") localStorage.removeItem("novo_theme");
      else localStorage.setItem("novo_theme", pref);
    } catch {}
  }, []);
  const toggleTheme = () => setThemePreference(theme === "dark" ? "light" : "dark");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(media.matches);
    try {
      const saved = localStorage.getItem("novo_theme");
      if (saved === "light" || saved === "dark") setThemePreferenceState(saved);
    } catch {}
    const follow = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    // Browser top bar / phone status bar follows the app theme too.
    const color = theme === "dark" ? "#000000" : "#ffffff";
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length === 0) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", color);
      document.head.appendChild(meta);
    }
    metas.forEach((m) => m.setAttribute("content", color));
  }, [theme]);

  // ── Auth ────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [backendAnalytics, setBackendAnalytics] = useState<PlatformAnalytics | null>(null);

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
    if (!token) setAuthReady(true);
  }, []);

  const persistRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem("novo_role", role);
    document.cookie = `novo_role=${role}; path=/; max-age=2592000; samesite=lax`;
  };

  const loginUser = (token: string, email?: string, role?: UserRole) => {
    localStorage.setItem("access_token", token);
    document.cookie = `access_token=${token}; path=/; max-age=2592000; samesite=lax`;
    if (email) localStorage.setItem("user_email", email);
    if (role) persistRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    for (const key of ["access_token", "user_email", "merchant_profile", "merchant_session", "novo_role"]) {
      localStorage.removeItem(key);
    }
    document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `novo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    setIsAuthenticated(false);
    setOrders([]);
    setMerchantStore(null);
    setRiderProfile(EMPTY_RIDER);
    setBackendAnalytics(null);
    setCurrentRole("customer");
    setCurrentUser(EMPTY_USER);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    apiService
      .getMe()
      .then((profile) => {
        if (cancelled || !profile) return;
        const userRole = (profile.role || "customer") as UserRole;
        setCurrentUser({
          id: profile.id || profile.user_id || "",
          name: profile.full_name || profile.name || profile.email?.split("@")[0] || "User",
          email: profile.email || "",
          phone: profile.phone || "",
          role: userRole,
          avatar: profile.avatar,
          address: profile.address || "",
          createdAt: profile.created_at || "",
        });
        persistRole(userRole);
      })
      .catch((e) => {
        console.warn("Session could not be validated:", e);
        // An expired/invalid token must not leave the UI looking signed in.
        if (!cancelled && /not authenticated|credentials|expired|subject/i.test(String(e?.message))) logout();
      })
      .finally(() => !cancelled && setAuthReady(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Cart persistence (per-browser convenience) ──────────────────────────
  useEffect(() => {
    try {
      localStorage.removeItem("novo_platform_state_v1");
      localStorage.removeItem("novo_platform_state_v2");
      const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setCart(saved);
    } catch {}
    setCartHydrated(true);
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, cartHydrated]);

  // ── Catalogue ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const backendStores = await apiService.getStores();
        const formatted = backendStores.map(normalizeStore);
        setStores(formatted);
        if (formatted.length > 0) setActiveStoreId((prev) => prev || formatted[0].id);
        setProducts(await apiService.getProducts());
      } catch (e) {
        console.error("Failed to load stores/products:", e);
      }
    })();
  }, []);

  // ── Orders ──────────────────────────────────────────────────────────────
  const refreshOrders = useCallback(async () => {
    if (!getToken()) return;
    setOrdersLoading(true);
    try {
      setOrders(await apiService.getOrders());
      setOrdersError(null);
    } catch (e: any) {
      setOrdersError(e?.message || "Could not load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // A device that already allowed alerts gets linked to whoever signs in on it.
  useEffect(() => {
    if (authReady && isAuthenticated) relinkPushIfGranted();
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    refreshOrders();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshOrders();
    }, ORDER_POLL_MS);
    return () => clearInterval(timer);
  }, [authReady, isAuthenticated, refreshOrders]);

  const replaceOrder = (updated: Order) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === updated.id);
      return exists ? prev.map((o) => (o.id === updated.id ? updated : o)) : [updated, ...prev];
    });
  };

  // ── Merchant store ──────────────────────────────────────────────────────
  const refreshMerchantStore = useCallback(async () => {
    setMerchantStoreLoading(true);
    try {
      const me = await apiService.getMerchantMe();
      const first = Array.isArray(me?.stores) && me.stores.length > 0 ? normalizeStore(me.stores[0]) : null;
      setMerchantStore(first);
      if (first) {
        setActiveStoreId(first.id);
        setStores((prev) => (prev.some((s) => s.id === first.id) ? prev.map((s) => (s.id === first.id ? first : s)) : [first, ...prev]));
      }
    } finally {
      setMerchantStoreLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authReady && isAuthenticated && currentRole === "merchant") refreshMerchantStore();
  }, [authReady, isAuthenticated, currentRole, refreshMerchantStore]);

  // ── Rider profile ───────────────────────────────────────────────────────
  const refreshRider = useCallback(async () => {
    try {
      const data = await apiService.getRiderMe();
      setRiderProfile((prev) => riderFromApi(data, prev));
    } catch (e) {
      console.warn("Could not load rider profile:", e);
    }
  }, []);

  useEffect(() => {
    if (authReady && isAuthenticated && currentRole === "rider") refreshRider();
  }, [authReady, isAuthenticated, currentRole, refreshRider]);

  useEffect(() => {
    setRiderProfile((prev) => ({
      ...prev,
      id: currentUser.id || prev.id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      avatar: currentUser.avatar || prev.avatar,
    }));
  }, [currentUser]);

  // ── Store management ────────────────────────────────────────────────────
  const addStore = (storeData: Omit<Store, "id" | "rating" | "reviewCount" | "isVerified">): Store => {
    // Local preview only; merchant registration creates the real store through apiService.createStore.
    const newId = `store-${Date.now()}`;
    const newStore: Store = {
      ...storeData,
      id: newId,
      banner: storeData.banner || getUniqueStoreBanner({ id: newId, name: storeData.name, category: storeData.category }),
      logo: storeData.logo || getUniqueStoreLogo({ id: newId, name: storeData.name, category: storeData.category }),
      rating: 5.0,
      reviewCount: 0,
      isVerified: false,
      status: "pending",
      isOpening: true,
    };
    setStores((prev) => [newStore, ...prev]);
    return newStore;
  };

  const applyStore = (store: Store) => {
    setStores((prev) => prev.map((s) => (s.id === store.id ? store : s)));
    setMerchantStore((prev) => (prev && prev.id === store.id ? store : prev));
  };

  const updateStore = async (id: string, updates: Partial<Store>) => {
    const saved = normalizeStore(await apiService.updateStore(id, storeUpdatesToApi(updates), getToken()));
    applyStore(saved);
    return saved;
  };

  const toggleStoreStatus = async (id: string) => {
    applyStore(normalizeStore(await apiService.toggleStoreOpenStatus(id, getToken())));
  };

  // ── Products ────────────────────────────────────────────────────────────
  const saveProduct = async (product: Partial<Product>, id?: string) => {
    const saved = id
      ? await apiService.updateProduct(id, product, getToken())
      : await apiService.createProduct(product, getToken());
    setProducts((prev) => (prev.some((p) => p.id === saved.id) ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]));
    return saved;
  };

  const addProduct = (product: Omit<Product, "id">) => saveProduct(product);
  const updateProduct = (id: string, updates: Partial<Product>) => saveProduct(updates, id);

  const deleteProduct = async (id: string) => {
    await apiService.deleteProduct(id, getToken());
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const refreshProducts = useCallback(async () => {
    setProducts(await apiService.getProducts());
  }, []);

  const toggleProductStock = async (id: string) => {
    const saved = await apiService.toggleProductStock(id, getToken());
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...saved } : p)));
  };

  // ── Cart ────────────────────────────────────────────────────────────────
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const openProduct = useCallback((product: Product) => setViewingProduct(product), []);
  const closeProduct = useCallback(() => setViewingProduct(null), []);

  /**
   * Returns false when nothing was added: the shopper declined to replace a cart from another
   * store, or the item has required choices and we opened its sheet instead.
   */
  const addToCart = (product: Product, quantity = 1, selectedOptions: any[] = [], specialInstructions = "") => {
    if (selectedOptions.length === 0 && needsChoices(product)) {
      setViewingProduct(product);
      return false;
    }
    const lineKey = cartLineKey({ product, selectedOptions });
    const cartStore = cart[0]?.product?.storeId;
    if (cartStore && product.storeId && cartStore !== product.storeId) {
      const ok = window.confirm("Your cart has items from another store. Start a new cart with this item?");
      if (!ok) return false;
      setCart([{ product, quantity, selectedOptions, specialInstructions }]);
      return true;
    }
    setCart((prev) => {
      const idx = prev.findIndex((item) => cartLineKey(item) === lineKey);
      if (idx > -1) {
        return prev.map((item, i) => (i === idx ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...prev, { product, quantity, selectedOptions, specialInstructions }];
    });
    return true;
  };

  const isLine = (item: CartItem, key: string) => cartLineKey(item) === key || item.product.id === key;

  const removeFromCart = (lineKey: string) => setCart((prev) => prev.filter((item) => !isLine(item, lineKey)));

  const updateCartQuantity = (lineKey: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(lineKey);
    setCart((prev) => prev.map((item) => (isLine(item, lineKey) ? { ...item, quantity } : item)));
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((acc, item) => {
    return acc + lineUnitPrice(item) * item.quantity;
  }, 0);

  const cartDeliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    const store = stores.find((s) => s.id === cart[0]?.product?.storeId);
    if (!store) return 450;
    return isStoreInDeliveryRange(store, userLocationAddress, userLocationCoords).deliveryFee;
  }, [cart, stores, userLocationAddress, userLocationCoords]);

  const cartTotal = cartSubtotal + cartDeliveryFee;

  // ── Orders: actions ─────────────────────────────────────────────────────
  const placeOrder = (
    deliveryAddress: string,
    paymentMethod: "card" | "cash" | "transfer",
    _tipAmount = 0,
    existingBackendOrder?: any
  ): Order => {
    if (!existingBackendOrder?.id) throw new Error("Order was not saved. Please try again.");
    const order: Order = existingBackendOrder.customerId !== undefined
      ? existingBackendOrder
      : apiService.normalizeOrder(existingBackendOrder);
    const store = stores.find((s) => s.id === order.storeId);
    const saved: Order = {
      ...order,
      storeName: order.storeName || store?.name || "",
      storeAddress: order.storeAddress || store?.address || "",
      deliveryAddress: order.deliveryAddress || deliveryAddress,
      paymentMethod: order.paymentMethod || paymentMethod,
    };
    replaceOrder(saved);
    clearCart();
    return saved;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, extra?: Record<string, any>) => {
    const updated = await apiService.updateOrderStatus(orderId, status, getToken(), extra);
    replaceOrder(updated);
    return updated;
  };

  const cancelOrder = async (orderId: string, reason = "") => {
    const updated = await apiService.cancelOrder(orderId, reason, getToken());
    replaceOrder(updated);
    return updated;
  };

  const rateOrder = (orderId: string, storeRating: number, riderRating: number, comment: string) => {
    // Ratings are not stored server-side yet (no reviews table); kept for this session only.
    setOrders((prev) => prev.map((ord) => (ord.id === orderId ? { ...ord, ratings: { storeRating, riderRating, comment } } : ord)));
    const target = orders.find((o) => o.id === orderId);
    if (target && comment) {
      setReviews((prev) => [
        {
          id: `rev-${Date.now()}`,
          orderId,
          customerName: target.customerName,
          storeId: target.storeId,
          rating: storeRating,
          comment,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  // ── Rider actions ───────────────────────────────────────────────────────
  const toggleRiderOnline = async () => {
    const data = await apiService.setRiderOnlineStatus(riderProfile.isOnline ? "offline" : "online");
    setRiderProfile((prev) => riderFromApi(data, prev));
    if (data?.status !== "offline") refreshOrders();
  };

  const acceptDeliveryJob = async (orderId: string) => {
    const order = await updateOrderStatus(orderId, "rider_assigned");
    setRiderProfile((prev) => ({ ...prev, currentOrderId: orderId }));
    return order;
  };

  const confirmPickup = (orderId: string, pickupCode: string) =>
    updateOrderStatus(orderId, "picked_up", { pickup_code: pickupCode });

  const completeDelivery = async (orderId: string, deliveryCode: string) => {
    const order = await updateOrderStatus(orderId, "delivered", { delivery_code: deliveryCode });
    setRiderProfile((prev) => ({ ...prev, currentOrderId: undefined }));
    refreshRider();
    return order;
  };

  const reportDeliveryProblem = async (orderId: string, reason: string) => {
    const order = await updateOrderStatus(orderId, "failed" as OrderStatus, { reason });
    setRiderProfile((prev) => ({ ...prev, currentOrderId: undefined }));
    refreshRider();
    return order;
  };

  // ── Admin actions ───────────────────────────────────────────────────────
  const approveStore = async (storeId: string) => {
    applyStore(normalizeStore(await apiService.verifyStore(storeId, true, getToken())));
  };

  const verifyRider = (_riderId: string) => {
    // Rider verification has no backend field yet; the admin page shows this as unavailable.
  };

  const activeOrder = orders.find((o) => o.status !== "delivered" && o.status !== "cancelled") || orders[0] || null;

  // ── Analytics ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authReady || !isAuthenticated || (currentRole !== "admin" && currentRole !== "merchant")) return;
    apiService
      .getAnalytics()
      .then((data) => data && typeof data === "object" && setBackendAnalytics(data))
      .catch(() => {});
  }, [authReady, isAuthenticated, currentRole, orders.length]);

  const totalRevenue = orders.filter((o) => o.paymentStatus === "paid").reduce((acc, o) => acc + o.total, 0);
  const analytics: PlatformAnalytics = backendAnalytics || {
    totalRevenue,
    totalOrders: orders.length,
    activeStoresCount: stores.filter((s) => s.status === "active").length,
    activeRidersCount: 0,
    totalCustomersCount: new Set(orders.map((o) => o.customerId)).size,
    gmvToday: totalRevenue,
    commissionEarned: Math.round(totalRevenue * 0.15),
  };

  const activeStore = merchantStore || stores.find((s) => s.id === activeStoreId) || stores[0] || ({} as Store);

  return (
    <PlatformContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        isAuthenticated,
        authReady,
        loginUser,
        logout,
        favorites,
        toggleFavorite,
        theme,
        themePreference,
        setThemePreference,
        toggleTheme,

        userLocationAddress,
        userLocationCoords,
        userLocationDetails,
        hasPickedLocation,
        setUserLocation,
        getStoreDeliveryDetails,

        stores,
        activeStoreId,
        setActiveStoreId,
        activeStore,
        merchantStore,
        merchantStoreLoading,
        refreshMerchantStore,
        addStore,
        updateStore,
        toggleStoreStatus,

        products,
        saveProduct,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        refreshProducts,

        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        openProduct,
        closeProduct,
        viewingProduct,
        clearCart,
        cartSubtotal,
        cartDeliveryFee,
        cartTotal,

        orders,
        ordersLoading,
        ordersError,
        refreshOrders,
        activeOrder,
        placeOrder,
        updateOrderStatus,
        cancelOrder,
        rateOrder,

        riderProfile,
        refreshRider,
        toggleRiderOnline,
        acceptDeliveryJob,
        confirmPickup,
        completeDelivery,
        reportDeliveryProblem,

        analytics,
        approveStore,
        verifyRider,

        reviews,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
};
