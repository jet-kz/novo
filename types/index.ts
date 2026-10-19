export type UserRole = "customer" | "merchant" | "rider" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  address?: string;
  createdAt: string;
}

export interface CustomerProfile extends User {
  role: "customer";
  savedAddresses: string[];
  favoriteStoreIds: string[];
}

export interface MerchantProfile {
  id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  businessName: string;
  businessType: string;
  address: string;
  isVerified?: boolean;
  isOpen?: boolean;
  deliveryFee?: number;
  minOrder?: number;
  createdAt?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface ProteinOption {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

export interface ProductSpecs {
  prepTime?: string;
  spicyLevel?: string;
  calories?: string;
  serves?: string;
}

/** One choice inside an option group, e.g. "Beef +₦500". */
export interface GroupOption {
  id: string;
  name: string;
  price: number;
  /** false = sold out today; still shown, can't be picked. */
  available?: boolean;
  /** How many of this one choice a customer may add (e.g. 3 × plantain). */
  max_qty?: number;
  image?: string;
}

/**
 * A question the customer answers about an item: "Choose your protein" (min 1, max 1),
 * "Extras" (min 0, max 5), "Size" (min 1, max 1)... min/max count total picks in the group.
 */
export interface OptionGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  options: GroupOption[];
}

/** What the customer picked, as stored on a cart line / order item. */
export interface SelectedOption {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  group?: string;
}

export interface PromoBanner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image: string;
  cta_label?: string | null;
  link_url?: string | null;
  placement: "home" | "shop";
  show_text: boolean;
  display_order: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  state?: "live" | "scheduled" | "ended" | "hidden";
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  options?: ProductOption[];
  optionGroups?: OptionGroup[];
  proteinOptions?: ProteinOption[];
  extrasOptions?: ExtraOption[];
  specs?: ProductSpecs;
  rating?: number;
  preparationTimeMinutes?: number;
}

export interface Store {
  id: string;
  merchantId?: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  /** Platform category slug (see PlatformCategory). Admins can add new ones. */
  category: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  deliveryRadiusKm?: number;
  cuisineType?: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  address: string;
  isOpening: boolean;
  isVerified: boolean;
  status: "active" | "pending" | "suspended";
  phone: string;
  complianceInfo?: {
    licenseNumber?: string;
    superintendentPharmacist?: string;
    nafdacNumber?: string;
    foodHygieneCert?: string;
    cacNumber?: string;
    hasColdChainStorage?: boolean;
    verificationStatus?: "verified" | "pending_review" | "document_required";
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: SelectedOption[];
  specialInstructions?: string;
}

export type OrderStatus =
  | "new"
  | "pending"
  | "pending_merchant"
  | "accepted"
  | "confirmed"
  | "preparing"
  | "ready"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "rider_assigned"
  | "picked_up"
  | "completed"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  /** Placed without an account; tracked via a private link. */
  isGuest?: boolean;
  deliveryAddress: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tip: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "card" | "cash" | "transfer";
  paymentStatus: "paid" | "pending" | "failed";
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderPhoto?: string;
  /** What the assigned rider earns for this job (delivery share + tip). */
  riderEarnings?: number;
  /** Shown to merchants/admins only; the rider must enter it at pickup. */
  pickupCode?: string;
  /** Customer-only: the 4-digit code they give the rider at the door. */
  deliveryCode?: string;
  /** Minutes until the rider reaches their next stop (server estimate). */
  etaMinutes?: number;
  /** Map points. storeLocation is missing until the merchant pins their store. */
  storeLocation?: GeoPoint | null;
  dropoffLocation?: GeoPoint | null;
  /** Rider's last GPS fix, only while they're on this job. */
  riderLocation?: (GeoPoint & { updatedAt?: string | null }) | null;
  estimatedDeliveryMinutes: number;
  createdAt: string;
  updatedAt: string;
  ratings?: {
    storeRating?: number;
    riderRating?: number;
    comment?: string;
  };
}

export interface WalletTransaction {
  id: string;
  reference: string;
  type: "credit" | "debit" | "commission" | "withdrawal";
  amount: number;
  description: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

export interface RiderProfile extends User {
  role: "rider";
  isOnline: boolean;
  isVerified: boolean;
  verificationStatus: "verified" | "pending" | "rejected";
  vehicleType: "motorcycle" | "bicycle" | "car";
  vehiclePlate?: string;
  rating: number;
  totalDeliveries: number;
  currentOrderId?: string;
  earningsToday: number;
  earningsThisWeek: number;
  tipsToday: number;
  /** Onboarding review from the backend; undefined until the profile has loaded. */
  approvalStatus?: "pending" | "approved" | "rejected";
  approvalNote?: string | null;
  idDocumentUrl?: string | null;
}

export interface DeliveryRequest {
  id: string;
  orderId: string;
  storeName: string;
  storeAddress: string;
  customerAddress: string;
  distanceKm: number;
  estimatedEarnings: number;
  itemsCount: number;
  pickupCode: string;
  expiresInSeconds: number;
}

export interface PlatformAnalytics {
  totalRevenue: number;
  totalOrders: number;
  activeStoresCount: number;
  activeRidersCount: number;
  totalCustomersCount: number;
  gmvToday: number;
  commissionEarned: number;
}

export interface Review {
  id: string;
  orderId: string;
  customerName: string;
  storeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/** Homepage category managed by admins. `slug` matches a store's category. */
export interface PlatformCategory {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  store_count?: number;
}

/** Featured strip on the homepage. */
export interface HomeCollection {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  image?: string | null;
  /** Platform category slug, or "all". */
  target_category: string;
  display_order: number;
  is_active: boolean;
}

/** A section of a store's menu, e.g. "Rice dishes". */
export interface MenuSection {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: "message" | "approval" | "system" | string;
  read_at: string | null;
  created_at: string;
}

/** Earnings maths for a merchant or rider (see backend PayoutService.earnings). */
export interface PayeeEarnings {
  orders: number;
  earned: number;
  /** Riders: cash/transfer-on-delivery money they collected, which belongs to Novo. */
  cash_collected: number;
  settled: number;
  /** What Novo still owes them; negative means they owe Novo. */
  owed: number;
}

export interface PayoutAccountView {
  status: "incomplete" | "in_review" | "active" | "restricted" | string;
  transfers_enabled: boolean;
  payouts_enabled: boolean;
  requirements_due: string[];
  bank_name?: string | null;
  account_last4?: string | null;
  account_name?: string | null;
}

export interface SettlementRow {
  id: string;
  payee_type: "merchant" | "rider";
  payee_id: string;
  amount: number;
  status: "processing" | "paid" | "failed";
  failure_reason?: string | null;
  note?: string | null;
  created_at: string;
}

export interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  failure_reason?: string | null;
  created_at: string;
}

export interface MyPayouts {
  payee_type: "merchant" | "rider";
  earnings: PayeeEarnings;
  account: PayoutAccountView | null;
  /** Settled money sitting in their Bachs account, ready to withdraw. */
  withdrawable: number | null;
  settlements: SettlementRow[];
  withdrawals: WithdrawalRow[];
}

export interface PayoutsOverview {
  bachs_configured: boolean;
  available_balance: number | null;
  payees: { payee_type: "merchant" | "rider"; payee_id: string; name: string; earnings: PayeeEarnings; account: PayoutAccountView | null }[];
  settlements: SettlementRow[];
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Row in the admin user directory. */
export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  roles: string[];
  is_active: boolean;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_verified: boolean;
  orders: number;
}
