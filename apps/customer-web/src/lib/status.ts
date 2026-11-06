import type { OrderStatus } from "@delivery/shared-types";

export const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Waiting for the merchant",
  ACCEPTED: "Accepted",
  PREPARING: "Being prepared",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected by the merchant",
};

/** Plain-language explanation shown on the order page. */
export const statusHint: Record<OrderStatus, string> = {
  PENDING: "The merchant hasn't accepted your order yet. You can still cancel it.",
  ACCEPTED: "The merchant accepted your order. You can still cancel until preparation starts.",
  PREPARING: "The merchant is preparing your order.",
  READY_FOR_PICKUP: "Your order is ready and waiting for a rider.",
  PICKED_UP: "A rider has your order and is on the way.",
  DELIVERED: "Your order was delivered. Enjoy!",
  CANCELLED: "This order was cancelled.",
  REJECTED: "The merchant couldn't take this order.",
};

/** Left-border color for list rows: amber = waiting, green = in progress or done, red = stopped. */
export const statusBorder: Record<OrderStatus, string> = {
  PENDING: "border-l-accent",
  ACCEPTED: "border-l-primary",
  PREPARING: "border-l-primary",
  READY_FOR_PICKUP: "border-l-primary",
  PICKED_UP: "border-l-primary",
  DELIVERED: "border-l-primary/40",
  CANCELLED: "border-l-danger",
  REJECTED: "border-l-danger",
};

export const isFinished = (status: OrderStatus) =>
  status === "DELIVERED" || status === "CANCELLED" || status === "REJECTED";
