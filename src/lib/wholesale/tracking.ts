import { hashTrackingToken } from "@/lib/wholesale/ids";
import type { WholesaleStore } from "@/lib/wholesale/memory-store";
import { paytrHashesEqual } from "@/lib/wholesale/paytr";
import type { WholesaleOrder } from "@/lib/wholesale/types";

export async function authorizeGuestTracking(input: {
  store: WholesaleStore;
  orderNumber: string;
  token: string;
}): Promise<WholesaleOrder | null> {
  const order = await input.store.getByOrderNumber(input.orderNumber);
  if (!order) {
    return null;
  }
  const incoming = hashTrackingToken(input.token);
  if (!paytrHashesEqual(incoming, order.trackingTokenHash)) {
    return null;
  }
  return order;
}

export async function authorizeOwnedOrder(input: {
  store: WholesaleStore;
  orderNumber: string;
  userId: string;
}): Promise<WholesaleOrder | null> {
  const order = await input.store.getByOrderNumber(input.orderNumber);
  if (!order || order.userId !== input.userId) {
    return null;
  }
  return order;
}

export async function attachEligibleGuestOrders(input: {
  store: WholesaleStore;
  userId: string;
  verifiedEmail: string;
}): Promise<number> {
  const email = input.verifiedEmail.trim().toLowerCase();
  if (!email || !input.userId) {
    return 0;
  }
  const guests = await input.store.listGuestOrdersByEmailHashMatch(email);
  let attached = 0;
  for (const order of guests) {
    if (order.guestEmail !== email) {
      continue;
    }
    const next = await input.store.attachUser(order.id, input.userId);
    if (next?.userId === input.userId) {
      attached += 1;
    }
  }
  return attached;
}
