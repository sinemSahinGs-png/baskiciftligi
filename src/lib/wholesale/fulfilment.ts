import { randomUUID } from "node:crypto";

import type { WholesaleStore } from "@/lib/wholesale/memory-store";
import {
  LIVE_FULFILMENT_STATES,
  type WholesaleFulfilmentState,
  type WholesaleOrder,
  type WholesalePaymentState,
} from "@/lib/wholesale/types";

export class WholesaleAdminError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "WholesaleAdminError";
  }
}

export function canEnterLiveFulfilment(order: WholesaleOrder): boolean {
  if (order.paytrTestMode) {
    return false;
  }
  return order.paymentState === "paid";
}

export async function updateWholesaleFulfilment(input: {
  store: WholesaleStore;
  orderId: string;
  actor: string;
  fulfilmentState?: WholesaleFulfilmentState;
  shipmentCarrier?: string | null;
  shipmentTrackingNumber?: string | null;
  shipmentTrackingUrl?: string | null;
  internalNote?: string | null;
  paymentReconcile?: never;
}): Promise<WholesaleOrder> {
  const order = await input.store.getById(input.orderId);
  if (!order) {
    throw new WholesaleAdminError("NOT_FOUND", "Sipariş bulunamadı.");
  }

  if (
    input.fulfilmentState &&
    LIVE_FULFILMENT_STATES.includes(input.fulfilmentState)
  ) {
    if (order.paytrTestMode) {
      throw new WholesaleAdminError(
        "TEST_ORDER",
        "Test modu siparişleri canlı operasyona alınamaz.",
      );
    }
    if (order.paymentState !== "paid") {
      throw new WholesaleAdminError(
        "UNPAID",
        "Ödemesi onaylanmamış sipariş kargoya hazırlanamaz.",
      );
    }
  }

  const previousFulfilment = order.fulfilmentState;
  const next: WholesaleOrder = {
    ...order,
    fulfilmentState: input.fulfilmentState ?? order.fulfilmentState,
    shipmentCarrier:
      input.shipmentCarrier !== undefined
        ? input.shipmentCarrier
        : order.shipmentCarrier,
    shipmentTrackingNumber:
      input.shipmentTrackingNumber !== undefined
        ? input.shipmentTrackingNumber
        : order.shipmentTrackingNumber,
    shipmentTrackingUrl:
      input.shipmentTrackingUrl !== undefined
        ? input.shipmentTrackingUrl
        : order.shipmentTrackingUrl,
    updatedAt: new Date().toISOString(),
  };

  if (next.fulfilmentState === "cancelled" && next.paymentState === "payment_pending") {
    next.paymentState = "cancelled";
  }

  await input.store.saveOrder(next);
  await input.store.appendEvent({
    id: randomUUID(),
    orderId: order.id,
    previousPaymentState: order.paymentState,
    newPaymentState: next.paymentState,
    previousFulfilmentState: previousFulfilment,
    newFulfilmentState: next.fulfilmentState,
    actor: input.actor,
    note: input.internalNote ?? null,
    createdAt: next.updatedAt,
  });
  return next;
}

export async function recordManualReconciliation(input: {
  store: WholesaleStore;
  orderId: string;
  actor: string;
  note: string;
}): Promise<WholesaleOrder> {
  const order = await input.store.getById(input.orderId);
  if (!order) {
    throw new WholesaleAdminError("NOT_FOUND", "Sipariş bulunamadı.");
  }
  await input.store.appendEvent({
    id: randomUUID(),
    orderId: order.id,
    previousPaymentState: order.paymentState,
    newPaymentState: order.paymentState,
    previousFulfilmentState: order.fulfilmentState,
    newFulfilmentState: order.fulfilmentState,
    actor: `manual_reconcile:${input.actor}`,
    note: input.note.slice(0, 300),
    createdAt: new Date().toISOString(),
  });
  return order;
}

export function paymentStates(): WholesalePaymentState[] {
  return [
    "payment_pending",
    "paid",
    "payment_failed",
    "cancelled",
    "refunded",
  ];
}
