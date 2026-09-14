"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
import { INITIAL_STORES, INITIAL_PRODUCTS, INITIAL_RIDERS, INITIAL_ORDERS, apiService } from "@/services/api";
import { getUniqueStoreBanner, getUniqueStoreLogo } from "@/utils/storeImageUtils";

interface PlatformContextType {
  // Role & Auth State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User;
  isAuthenticated: boolean;
  loginUser: (token: string, email?: string) => void;
  logout: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;

  // Stores
  stores: Store[];
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  activeStore: Store;
  addStore: (store: Omit<Store, "id" | "rating" | "reviewCount" | "isVerified">) => Store;
  updateStore: (id: string, updates: Partial<Store>) => void;
  toggleStoreStatus: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStock: (id: string) => void;

  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, selectedOptions?: any[], specialInstructions?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;

  // Orders
  orders: Order[];
  activeOrder: Order | null;
  placeOrder: (
    deliveryAddress: string,
    paymentMethod: "card" | "cash" | "transfer",
    tipAmount: number,
    existingBackendOrder?: any
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  rateOrder: (orderId: string, storeRating: number, riderRating: number, comment: string) => void;

  // Rider State
  riderProfile: RiderProfile;
  toggleRiderOnline: () => void;
  acceptDeliveryJob: (orderId: string) => void;
  completeDelivery: (orderId: string) => void;

  // Admin Analytics
  analytics: PlatformAnalytics;
  approveStore: (storeId: string) => void;
  verifyRider: (riderId: string) => void;

  // Reviews
  reviews: Review[];
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "novo_platform_state_v2";

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>("customer");

  const [currentUser, setCurrentUser] = useState<User>({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "customer",
    address: "",
    createdAt: new Date().toISOString(),
  });

  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [riderProfile, setRiderProfile] = useState<RiderProfile>({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "rider",
    avatar: "",
    address: "",
    createdAt: new Date().toISOString(),
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
  });
  const [reviews, setReviews] = useState<Review[]>([]);

  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = (localStorage.getItem("novo_theme") as "light" | "dark") || "light";
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("novo_theme", theme);
    }
  }, [theme]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      setIsAuthenticated(!!token);
    }
  }, []);

  const loginUser = (token: string, email?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
      document.cookie = `access_token=${token}; path=/; max-age=2592000`;
      if (email) {
        localStorage.setItem("user_email", email);
        if (email.toLowerCase().includes("admin") || email === "admin@novo.ng") {
          localStorage.setItem("novo_role", "admin");
          document.cookie = `novo_role=admin; path=/; max-age=2592000`;
          setCurrentRole("admin");
        }
      }
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("merchant_profile");
      localStorage.removeItem("novo_role");
      document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `novo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    setIsAuthenticated(false);
    setCurrentUser({
      id: "",
      name: "",
      email: "",
      phone: "",
      role: "customer",
      address: "",
      createdAt: new Date().toISOString(),
    });
  };

  // Fetch logged in user profile
  useEffect(() => {
    async function loadUserProfile() {
      if (isAuthenticated) {
        try {
          const profile = await apiService.getMe();
          if (profile) {
            const userRole = profile.role || (profile.email?.includes("admin") ? "admin" : "customer");
            setCurrentUser({
              id: profile.id || profile.user_id || "usr-me",
              name: profile.full_name || profile.name || profile.email?.split("@")[0] || "User",
              email: profile.email || "",
              phone: profile.phone || "",
              role: userRole as UserRole,
              address: profile.address || "",
              createdAt: profile.created_at || new Date().toISOString(),
            });
            if (userRole === "admin" || userRole === "super_admin") {
              setCurrentRole("admin");
              if (typeof window !== "undefined") {
                localStorage.setItem("novo_role", "admin");
                document.cookie = `novo_role=admin; path=/; max-age=2592000`;
              }
            }
          }
        } catch (e) {
          console.warn("Failed to load user profile in PlatformContext:", e);
        }
      }
    }
    loadUserProfile();
  }, [isAuthenticated]);

  // Load cart state from LocalStorage on client start
  useEffect(() => {
    try {
      localStorage.removeItem("novo_platform_state_v1");
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cart && Array.isArray(parsed.cart)) setCart(parsed.cart);
      }
    } catch (e) {
      console.warn("Failed to load cart state from localStorage", e);
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("novo_platform_state_v1");
        localStorage.removeItem("novo_platform_state_v2");
      } catch (e) {
        console.warn("Error purging stale storage keys:", e);
      }
    }
  }, []);

  // Fetch backend stores and products on mount
  useEffect(() => {
    async function loadBackendStoresAndProducts() {
      try {
        const backendStores = await apiService.getStores();
        if (Array.isArray(backendStores)) {
          const formattedStores: Store[] = backendStores.map((bs: any) => ({
            id: bs.id,
            merchantId: bs.merchant_id,
            name: bs.name,
            slug: bs.slug || (bs.name ? bs.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `store-${bs.id}`),
            description: bs.description || `${bs.name} - Quality items & fast delivery`,
            category: (bs.store_type || "restaurant").toLowerCase() as any,
            address: bs.address || "Lagos, Nigeria",
            phone: bs.phone || "+2348000000000",
            rating: bs.rating || 5.0,
            reviewCount: bs.review_count || 0,
            isVerified: true,
            status: "active",
            isOpening: bs.is_open ?? true,
            banner: getUniqueStoreBanner({ id: bs.id, name: bs.name, category: bs.store_type, banner: bs.banner }),
            logo: getUniqueStoreLogo({ id: bs.id, name: bs.name, category: bs.store_type, logo: bs.logo }),
            deliveryFee: 450,
            deliveryTime: "20-30 min",
            minOrder: 1000,
            cuisineType: bs.store_type || "Restaurant",
          }));

          setStores(formattedStores);
          if (formattedStores.length > 0) {
            setActiveStoreId((prev) => prev || formattedStores[0].id);
          }
        }

        const backendProducts = await apiService.getProducts();
        if (Array.isArray(backendProducts)) {
          const formattedProducts: Product[] = backendProducts.map((bp: any) => ({
            id: bp.id,
            storeId: bp.store_id || bp.storeId,
            name: bp.name,
            description: bp.description || "",
            price: bp.price || 0,
            category: bp.category || "General",
            image: bp.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
            inStock: bp.in_stock !== false,
          }));
          setProducts(formattedProducts);
        }

        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (token) {
          const backendOrders = await apiService.getOrders(undefined, token);
          if (Array.isArray(backendOrders) && backendOrders.length > 0) {
            setOrders(backendOrders);
          }
        }
      } catch (e) {
        console.error("Failed to load backend stores/products in PlatformContext:", e);
      }
    }

    loadBackendStoresAndProducts();
  }, []);


  // Store management
  const addStore = (storeData: Omit<Store, "id" | "rating" | "reviewCount" | "isVerified">): Store => {
    const newId = `store-${Date.now()}`;
    const newStore: Store = {
      ...storeData,
      id: newId,
      banner: storeData.banner || getUniqueStoreBanner({ id: newId, name: storeData.name, category: storeData.category }),
      logo: storeData.logo || getUniqueStoreLogo({ id: newId, name: storeData.name, category: storeData.category }),
      rating: 5.0,
      reviewCount: 0,
      isVerified: true,
      status: "active",
      isOpening: true,
    };
    setStores((prev) => [newStore, ...prev]);
    setActiveStoreId(newStore.id);
    return newStore;
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const toggleStoreStatus = (id: string) => {
    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isOpening: !s.isOpening } : s))
    );
  };

  // Product management
  const addProduct = (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleProductStock = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p))
    );
  };

  // Cart operations
  const addToCart = (
    product: Product,
    quantity = 1,
    selectedOptions: any[] = [],
    specialInstructions = ""
  ) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [
        ...prevCart,
        {
          product,
          quantity,
          selectedOptions,
          specialInstructions,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((acc, item) => {
    const optionsPrice = (item.selectedOptions || []).reduce((oAcc, opt) => oAcc + opt.price, 0);
    return acc + (item.product.price + optionsPrice) * item.quantity;
  }, 0);

  const cartDeliveryFee = cart.length > 0 ? 450 : 0;
  const cartServiceFee = cart.length > 0 ? 200 : 0;
  const cartTotal = cartSubtotal + cartDeliveryFee + cartServiceFee;

  // Orders
  const placeOrder = (
    deliveryAddress: string,
    paymentMethod: "card" | "cash" | "transfer",
    tipAmount = 0,
    existingBackendOrder?: any
  ): Order => {
    const targetStoreId = cart[0]?.product?.storeId || (cart[0]?.product as any)?.store_id;
    const store = stores.find((s) => s.id === targetStoreId) || stores[0];

    const newOrder: Order = existingBackendOrder
      ? {
          id: existingBackendOrder.id,
          customerId: existingBackendOrder.customer_id || currentUser.id,
          customerName: existingBackendOrder.customer_name || currentUser.name || "Customer",
          customerPhone: currentUser.phone || "",
          deliveryAddress: existingBackendOrder.delivery_address || deliveryAddress,
          storeId: targetStoreId || store.id,
          storeName: store?.name || "Merchant Store",
          storeAddress: store?.address || "",
          items: [...cart],
          subtotal: existingBackendOrder.subtotal || cartSubtotal,
          deliveryFee: existingBackendOrder.delivery_fee || cartDeliveryFee,
          serviceFee: existingBackendOrder.service_fee || cartServiceFee,
          tip: existingBackendOrder.tip || tipAmount,
          total: existingBackendOrder.total || (cartSubtotal + cartDeliveryFee + cartServiceFee + tipAmount),
          status: "pending_merchant",
          paymentMethod,
          paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
          pickupCode: String(Math.floor(1000 + Math.random() * 9000)),
          estimatedDeliveryMinutes: 25,
          createdAt: existingBackendOrder.created_at || new Date().toISOString(),
          updatedAt: existingBackendOrder.updated_at || new Date().toISOString(),
        }
      : {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerPhone: currentUser.phone,
          deliveryAddress: deliveryAddress || currentUser.address || "14 Commercial Avenue, Central District",
          storeId: targetStoreId || store?.id,
          storeName: store?.name || "Merchant Store",
          storeAddress: store?.address,
          items: [...cart],
          subtotal: cartSubtotal,
          deliveryFee: cartDeliveryFee,
          serviceFee: cartServiceFee,
          tip: tipAmount,
          total: cartSubtotal + cartDeliveryFee + cartServiceFee + tipAmount,
          status: "pending_merchant",
          paymentMethod,
          paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
          pickupCode: String(Math.floor(1000 + Math.random() * 9000)),
          estimatedDeliveryMinutes: 25,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status,
              updatedAt: new Date().toISOString(),
              ...(status === "rider_assigned" && !ord.riderId
                ? {
                    riderId: riderProfile.id,
                    riderName: riderProfile.name,
                    riderPhone: riderProfile.phone,
                    riderPhoto: riderProfile.avatar,
                  }
                : {}),
            }
          : ord
      )
    );
  };

  const rateOrder = (
    orderId: string,
    storeRating: number,
    riderRating: number,
    comment: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              ratings: { storeRating, riderRating, comment },
            }
          : ord
      )
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder && comment) {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        orderId,
        customerName: targetOrder.customerName,
        storeId: targetOrder.storeId,
        rating: storeRating,
        comment,
        createdAt: new Date().toISOString(),
      };
      setReviews((prev) => [newReview, ...prev]);
    }
  };

  // Rider actions
  const toggleRiderOnline = () => {
    setRiderProfile((prev) => ({ ...prev, isOnline: !prev.isOnline }));
  };

  const acceptDeliveryJob = (orderId: string) => {
    setRiderProfile((prev) => ({ ...prev, currentOrderId: orderId }));
    updateOrderStatus(orderId, "rider_assigned");
  };

  const completeDelivery = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const earned = targetOrder ? targetOrder.deliveryFee + targetOrder.tip : 950;

    setRiderProfile((prev) => ({
      ...prev,
      currentOrderId: undefined,
      totalDeliveries: prev.totalDeliveries + 1,
      earningsToday: prev.earningsToday + earned,
      earningsThisWeek: prev.earningsThisWeek + earned,
      tipsToday: prev.tipsToday + (targetOrder?.tip || 0),
    }));

    updateOrderStatus(orderId, "delivered");
  };

  // Admin actions
  const approveStore = (storeId: string) => {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, isVerified: true, status: "active" } : s))
    );
  };

  const verifyRider = (riderId: string) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, isVerified: true, verificationStatus: "verified" } : r))
    );
  };

  const activeOrder = orders[0] || null;

  // Platform Analytics computation
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const commissionEarned = Math.round(totalRevenue * 0.15);

  const analytics: PlatformAnalytics = {
    totalRevenue: totalRevenue,
    totalOrders: orders.length,
    activeStoresCount: stores.filter((s) => s.status === "active").length,
    activeRidersCount: riders.length,
    totalCustomersCount: orders.length,
    gmvToday: totalRevenue,
    commissionEarned: commissionEarned,
  };

  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0] || ({} as Store);

  return (
    <PlatformContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        isAuthenticated,
        loginUser,
        logout,
        favorites,
        toggleFavorite,
        theme,
        toggleTheme,

        stores,
        activeStoreId,
        setActiveStoreId,
        activeStore,
        addStore,
        updateStore,
        toggleStoreStatus,

        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,

        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartDeliveryFee,
        cartTotal,

        orders,
        activeOrder,
        placeOrder,
        updateOrderStatus,
        rateOrder,

        riderProfile,
        toggleRiderOnline,
        acceptDeliveryJob,
        completeDelivery,

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
