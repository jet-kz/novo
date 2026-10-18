import type { OrderStatus } from "@/types";

/**
 * Single source of truth for order-status groupings and labels in the UI.
 * Mirrors the backend lifecycle in novobackend/app/modules/orders/status.py:
 * pending_merchant -> accepted -> preparing -> ready_for_pickup -> rider_assigned -> picked_up -> delivered
 */
export const NEW_STATUSES: OrderStatus[] = ["pending_merchant", "pending", "new"];
export const KITCHEN_STATUSES: OrderStatus[] = ["accepted", "confirmed", "preparing"];
export const READY_STATUSES: OrderStatus[] = ["ready_for_pickup", "ready"];
export const ON_THE_WAY_STATUSES: OrderStatus[] = ["rider_assigned", "picked_up", "out_for_delivery"];
export const DONE_STATUSES: OrderStatus[] = ["delivered", "completed"];

export const isNewOrder = (s: OrderStatus) => NEW_STATUSES.includes(s);
export const isInKitchen = (s: OrderStatus) => KITCHEN_STATUSES.includes(s);
export const isReady = (s: OrderStatus) => READY_STATUSES.includes(s);
export const isOnTheWay = (s: OrderStatus) => ON_THE_WAY_STATUSES.includes(s);
export const isDone = (s: OrderStatus) => DONE_STATUSES.includes(s);
export const isCancelled = (s: OrderStatus) => s === "cancelled";
export const isActive = (s: OrderStatus) => !isDone(s) && !isCancelled(s);

/** Customers can cancel only before the kitchen starts. */
export const customerCanCancel = (s: OrderStatus) => isNewOrder(s) || s === "accepted" || s === "confirmed";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  pending: "Awaiting store",
  pending_merchant: "Awaiting store",
  accepted: "Accepted",
  confirmed: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  ready_for_pickup: "Ready for pickup",
  rider_assigned: "Rider assigned",
  picked_up: "On the way",
  out_for_delivery: "On the way",
  completed: "Delivered",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const statusLabel = (s: OrderStatus) => ORDER_STATUS_LABELS[s] || s;

/** The next step a merchant can take, or null when the order is out of their hands. */
export function merchantNextStep(s: OrderStatus): { status: OrderStatus; label: string } | null {
  if (isNewOrder(s) || s === "accepted" || s === "confirmed") return { status: "preparing", label: "Accept & start preparing" };
  if (s === "preparing") return { status: "ready_for_pickup", label: "Mark ready for pickup" };
  return null;
}

export const merchantCanReject = (s: OrderStatus) => isNewOrder(s) || isInKitchen(s);

/** Moves an admin may make from each status (mirrors ALLOWED_TRANSITIONS on the backend; rider assignment excluded). */
export function adminNextSteps(s: OrderStatus): OrderStatus[] {
  if (isNewOrder(s)) return ["accepted", "preparing", "cancelled"];
  if (s === "accepted" || s === "confirmed") return ["preparing", "cancelled"];
  if (s === "preparing") return ["ready_for_pickup", "cancelled"];
  if (isReady(s)) return ["cancelled"];
  if (s === "rider_assigned") return ["picked_up", "ready_for_pickup", "cancelled"];
  if (s === "picked_up" || s === "out_for_delivery") return ["delivered"];
  return [];
}
