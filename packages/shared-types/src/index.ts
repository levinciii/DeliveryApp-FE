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

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

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
