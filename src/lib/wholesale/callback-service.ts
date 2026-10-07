import { randomUUID } from "node:crypto";

import {
  parsePaytrTotalAmount,
  verifyPaytrCallbackHash,
  type PaytrCallbackPayload,
  type PaytrCredentials,
} from "@/lib/wholesale/paytr";
import type { WholesaleStore } from "@/lib/wholesale/memory-store";
import type { WholesaleOrder } from "@/lib/wholesale/types";

export type CallbackHandleResult =
  | { ok: true; applied: boolean; order: WholesaleOrder }
  | { ok: false; reason: string };

export async function handlePaytrCallback(input: {
  store: WholesaleStore;
  payload: PaytrCallbackPayload;
  credentials: PaytrCredentials;
  requestId: string;
}): Promise<CallbackHandleResult> {
  if (!verifyPaytrCallbackHash(input.payload, input.credentials)) {
    return { ok: false, reason: "invalid_hash" };
  }

  const order = await input.store.getByMerchantOid(input.payload.merchantOid);
  if (!order) {
    return { ok: false, reason: "unknown_order" };
  }

  let paidAmount: number;
  try {
    paidAmount = parsePaytrTotalAmount(input.payload.totalAmount);
  } catch {
    return { ok: false, reason: "invalid_amount" };
  }

  if (paidAmount !== order.grandTotalMinor) {
    return { ok: false, reason: "amount_mismatch" };
  }

  if (input.payload.status === "success") {
    if (order.paymentState === "paid") {
      return { ok: true, applied: false, order };
    }
    if (order.paymentState === "refunded" || order.paymentState === "cancelled") {
      return { ok: false, reason: "immutable_state" };
    }

    const now = new Date().toISOString();
    const next: WholesaleOrder = {
      ...order,
      paymentState: "paid",
      paytrPaidAmountMinor: paidAmount,
      paytrPaymentType: input.payload.paymentType ?? order.paytrPaymentType,
      paytrFailureCode: null,
      paytrFailureMessage: null,
      paidAt: now,
      updatedAt: now,
    };
    await input.store.saveOrder(next);
    if (next.paytrTestMode) {
      await input.store.recordPaytrTestCallback();
    }
    await input.store.appendEvent({
      id: randomUUID(),
      orderId: order.id,
      previousPaymentState: order.paymentState,
      newPaymentState: "paid",
      previousFulfilmentState: order.fulfilmentState,
      newFulfilmentState: order.fulfilmentState,
      actor: "paytr_callback",
      note: `request:${input.requestId}`,
      createdAt: now,
    });
    return { ok: true, applied: true, order: next };
  }

  if (order.paymentState === "paid") {
    return { ok: true, applied: false, order };
  }

  const now = new Date().toISOString();
  const failed: WholesaleOrder = {
    ...order,
    paymentState: "payment_failed",
    paytrFailureCode: input.payload.failedReasonCode ?? null,
    paytrFailureMessage: sanitizeFailureMessage(
      input.payload.failedReasonMsg,
    ),
    updatedAt: now,
  };
  await input.store.saveOrder(failed);
  await input.store.appendEvent({
    id: randomUUID(),
    orderId: order.id,
    previousPaymentState: order.paymentState,
    newPaymentState: "payment_failed",
    previousFulfilmentState: order.fulfilmentState,
    newFulfilmentState: order.fulfilmentState,
    actor: "paytr_callback",
    note: `request:${input.requestId}`,
    createdAt: now,
  });
  return { ok: true, applied: true, order: failed };
}

function sanitizeFailureMessage(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.replace(/[\r\n\t]+/g, " ").slice(0, 180);
}

export function successRedirectDoesNotPay(): false {
  return false;
}
