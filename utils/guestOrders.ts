/**
 * Guest orders placed on this device. The token is the guest's key to the order (the backend
 * only stores its hash), so it's kept here and in the tracking link we email them.
 */
export interface GuestOrderRef {
  id: string;
  token: string;
  storeName?: string;
  total?: number;
  createdAt: string;
}

const KEY = "novo_guest_orders";
const MAX_KEPT = 20;

export function listGuestOrders(): GuestOrderRef[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((o) => o?.id && o?.token) : [];
  } catch {
    return [];
  }
}

export function saveGuestOrder(ref: GuestOrderRef) {
  try {
    const rest = listGuestOrders().filter((o) => o.id !== ref.id);
    localStorage.setItem(KEY, JSON.stringify([ref, ...rest].slice(0, MAX_KEPT)));
  } catch {}
}

export function guestTrackingPath(id: string, token: string) {
  return `/track/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`;
}
