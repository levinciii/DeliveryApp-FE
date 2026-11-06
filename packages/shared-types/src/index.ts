// Types that mirror the backend API (BE/README.md "Endpoints"). Keep in sync with the server.

export type Role = "CUSTOMER" | "MERCHANT_OWNER" | "MERCHANT_STAFF" | "RIDER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** POST /auth/register and /auth/login */
export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: number;
}

/** POST /auth/refresh (rotating refresh tokens: always store the new refreshToken). */
export type TokenPair = Omit<AuthResponse, "user">;

/** Every list endpoint returns this envelope. */
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Error body for every non-2xx response; validation errors (400) include `issues`. */
export interface ApiErrorBody {
  message: string;
  statusCode: number;
  issues?: { path: string; message: string }[];
  /** Present on conflicts the UI can react to: CART_BRANCH_CONFLICT, CART_ITEMS_UNAVAILABLE, OUT_OF_RANGE. */
  code?: string;
  /** With CART_ITEMS_UNAVAILABLE: names of the products that can't be ordered. */
  unavailable?: string[];
}

export type MerchantStatus = "PENDING_APPROVAL" | "APPROVED" | "SUSPENDED" | "REJECTED";

export interface Merchant {
  id: string;
  businessName: string;
  status: MerchantStatus;
  ownerUserId: string;
  branchCount: number;
  createdAt: string;
}

/** One entry of the customer-facing directory (GET /branches). Only branches that can take orders are listed. */
export interface BranchSummary {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  merchantName: string;
  /** Active products on the menu. */
  productCount: number;
}

export type ProductStatus = "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";

export interface Product {
  id: string;
  branchId: string;
  categoryId: string | null;
  name: string;
  /** 2-decimal string such as "150.00" (never a JS number). */
  price: string;
  status: ProductStatus;
}

export interface Address {
  id: string;
  label: string | null;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CartLine {
  productId: string;
  name: string;
  /** 2-decimal money strings, like every amount from the API. */
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  /** false when the product or its branch was switched off after it went in the cart. */
  available: boolean;
}

export interface Cart {
  branch: { id: string; name: string; merchantName: string } | null;
  items: CartLine[];
  itemCount: number;
  subtotal: string;
}

/** POST /orders/quote: what checkout would charge. */
export interface Quote {
  branchId: string;
  distanceKm: string;
  subtotal: string;
  deliveryFee: string;
  serviceFee: string;
  total: string;
}

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

/** Rows of GET /orders. */
export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: string;
  itemCount: number;
  branch: { id: string; name: string };
  customerName: string;
  createdAt: string;
  /** What the signed-in user may do next. Show buttons from this; never copy the rules into the UI. */
  allowedNextStatuses: OrderStatus[];
}

export interface OrderLine {
  productId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

/** GET /orders/:id */
export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  branch: { id: string; name: string; merchantName: string };
  customer: { name: string; phone: string | null };
  deliveryAddress: { address: string; latitude: number; longitude: number };
  items: OrderLine[];
  subtotal: string;
  deliveryFee: string;
  serviceFee: string;
  total: string;
  payment: { method: "COD" | "GCASH" | "MAYA" | "CARD"; status: PaymentStatus; amount: string } | null;
  history: { status: OrderStatus; changedAt: string }[];
  allowedNextStatuses: OrderStatus[];
}

export type DeliveryStatus =
  | "UNASSIGNED"
  | "OFFERED"
  | "ACCEPTED"
  | "ARRIVED_AT_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED";

export interface DeliveryLocationPing {
  deliveryId: string;
  latitude: number;
  longitude: number;
}
