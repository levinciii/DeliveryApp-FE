import type { OrderStatus } from "@delivery/shared-types";

export const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

/** Left-border color for list rows: amber = needs action, green = moving or done, red = stopped. */
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

/** Button text for moving an order TO a status. */
export const actionLabel: Partial<Record<OrderStatus, string>> = {
  ACCEPTED: "Accept",
  REJECTED: "Reject",
  PREPARING: "Start preparing",
  READY_FOR_PICKUP: "Mark ready",
  CANCELLED: "Cancel order",
};

/** Moves that stop the order for good ask for confirmation first. */
export const isDestructive = (status: OrderStatus) => status === "CANCELLED" || status === "REJECTED";
