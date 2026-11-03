import { randomUUID } from "node:crypto";

import { buildAgreementAcceptances } from "@/lib/wholesale/agreements";
import {
  createMerchantOid,
  createTrackingToken,
  createWholesaleOrderId,
  createWholesaleOrderNumber,
  hashTrackingToken,
} from "@/lib/wholesale/ids";
import type { WholesaleStore } from "@/lib/wholesale/memory-store";
import { quoteWholesalePackage } from "@/lib/wholesale/packages";
import { STOCK_POLICY, type WholesaleOrder } from "@/lib/wholesale/types";
import type { WholesaleCheckoutInput } from "@/lib/wholesale/validation";

export class WholesaleCheckoutError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "WholesaleCheckoutError";
  }
}

export interface CheckoutActor {
  userId: string | null;
  email: string | null;
}

export interface CheckoutResult {
  order: WholesaleOrder;
  trackingToken: string;
  duplicate: boolean;
}

export async function createWholesaleCheckoutOrder(input: {
  store: WholesaleStore;
  payload: WholesaleCheckoutInput;
  actor: CheckoutActor;
  paytrTestMode: boolean;
  now?: Date;
}): Promise<CheckoutResult> {
  const existing = await input.store.getByIdempotencyKey(
    input.payload.idempotencyKey,
  );
  if (existing) {
    return { order: existing, trackingToken: "", duplicate: true };
  }

  const settings = await input.store.getSettings();
  if (
    settings.shippingGrossMinor === null ||
    settings.shippingGrossMinor === undefined
  ) {
    throw new WholesaleCheckoutError(
      "SHIPPING_UNCONFIGURED",
      "Toptan siparişler kısa süre içinde açılacaktır.",
    );
  }
  if (!settings.checkoutOpen) {
    throw new WholesaleCheckoutError(
      "CHECKOUT_CLOSED",
      "Toptan siparişler kısa süre içinde açılacaktır.",
    );
  }

  const quote = quoteWholesalePackage(
    input.payload.packageSku,
    settings.shippingGrossMinor,
  );

  if (
    input.payload.clientGrandTotalMinor !== undefined &&
    input.payload.clientGrandTotalMinor !== quote.grandTotalMinor
  ) {
    // Client totals are informational only; server quote always wins.
  }
  if (
    input.payload.clientUnitPriceMinor !== undefined &&
    input.payload.clientUnitPriceMinor !== quote.unitGrossMinor
  ) {
    // ignored
  }

  void STOCK_POLICY;

  const now = (input.now ?? new Date()).toISOString();
  const trackingToken = createTrackingToken();
  const invoiceAddress = input.payload.sameAsShipping
    ? null
    : (input.payload.invoiceAddress ?? null);

  const order: WholesaleOrder = {
    id: createWholesaleOrderId(),
    orderNumber: createWholesaleOrderNumber(),
    merchantOid: createMerchantOid(),
    idempotencyKey: input.payload.idempotencyKey,
    userId: input.actor.userId,
    guestEmail: input.payload.customer.email,
    trackingTokenHash: hashTrackingToken(trackingToken),
    packageSku: quote.sku,
    unitQuantity: quote.quantity,
    unitGrossMinor: quote.unitGrossMinor,
    productGrossMinor: quote.productGrossMinor,
    standGrossMinor: quote.standGrossMinor,
    shippingGrossMinor: quote.shippingGrossMinor,
    grandTotalMinor: quote.grandTotalMinor,
    currency: "TRY",
    paymentState: "payment_pending",
    fulfilmentState: "new",
    customer: input.payload.customer,
    shippingAddress: input.payload.customer,
    invoice: {
      type: input.payload.invoiceType,
      sameAsShipping: input.payload.sameAsShipping,
      companyName:
        input.payload.invoiceType === "kurumsal"
          ? input.payload.companyName ?? null
          : null,
      taxOffice:
        input.payload.invoiceType === "kurumsal"
          ? input.payload.taxOffice ?? null
          : null,
      taxNumber:
        input.payload.invoiceType === "kurumsal"
          ? input.payload.taxNumber ?? null
          : null,
      address: invoiceAddress,
    },
    customerNote: input.payload.customerNote?.trim() || null,
    agreements: buildAgreementAcceptances({
      quote,
      customer: input.payload.customer,
      invoice: {
        type: input.payload.invoiceType,
        sameAsShipping: input.payload.sameAsShipping,
        companyName: input.payload.companyName ?? null,
        taxOffice: input.payload.taxOffice ?? null,
        taxNumber: input.payload.taxNumber ?? null,
        address: invoiceAddress,
      },
      orderNumber: undefined,
    }),
    paytrPaymentType: null,
    paytrPaidAmountMinor: null,
    paytrFailureCode: null,
    paytrFailureMessage: null,
    paytrTestMode: input.paytrTestMode,
    shipmentCarrier: null,
    shipmentTrackingNumber: null,
    shipmentTrackingUrl: null,
    emailStatus: null,
    createdAt: now,
    updatedAt: now,
    paidAt: null,
  };

  order.agreements = buildAgreementAcceptances({
    quote,
    customer: order.customer,
    invoice: order.invoice,
    orderNumber: order.orderNumber,
  }, now);

  try {
    await input.store.createOrder(order);
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_IDEMPOTENCY") {
      const raced = await input.store.getByIdempotencyKey(
        input.payload.idempotencyKey,
      );
      if (raced) {
        return { order: raced, trackingToken: "", duplicate: true };
      }
    }
    throw error;
  }

  await input.store.appendEvent({
    id: randomUUID(),
    orderId: order.id,
    previousPaymentState: null,
    newPaymentState: "payment_pending",
    previousFulfilmentState: null,
    newFulfilmentState: "new",
    actor: input.actor.userId ? `user:${input.actor.userId}` : "guest",
    note: "Sipariş oluşturuldu; ödeme bekleniyor.",
    createdAt: now,
  });

  return { order, trackingToken, duplicate: false };
}

export function publicOrderStatus(order: WholesaleOrder) {
  return {
    orderNumber: order.orderNumber,
    paymentState: order.paymentState,
    fulfilmentState: order.fulfilmentState,
    paymentLabel: paymentLabelFor(order.paymentState),
    fulfilmentLabel: fulfilmentLabelFor(order.fulfilmentState),
    packageTitle: packageTitleFor(order.packageSku),
    grandTotalMinor: order.grandTotalMinor,
    currency: order.currency,
    shipmentCarrier: order.shipmentCarrier,
    shipmentTrackingNumber: order.shipmentTrackingNumber,
    shipmentTrackingUrl: order.shipmentTrackingUrl,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
  };
}

function paymentLabelFor(state: WholesaleOrder["paymentState"]) {
  const map = {
    payment_pending: "Ödeme bekleniyor",
    paid: "Ödendi",
    payment_failed: "Ödeme alınamadı",
    cancelled: "İptal",
    refunded: "İade",
  } as const;
  return map[state];
}

function fulfilmentLabelFor(state: WholesaleOrder["fulfilmentState"]) {
  const map = {
    new: "Sipariş alındı",
    preparing: "Hazırlanıyor",
    ready_to_ship: "Kargoya hazır",
    shipped: "Kargoya verildi",
    delivered: "Teslim edildi",
    cancelled: "İptal",
  } as const;
  return map[state];
}

function packageTitleFor(sku: WholesaleOrder["packageSku"]) {
  return sku === "WS-LIGHTER-100" ? "100’lü Mağaza Paketi" : "50’li Başlangıç Paketi";
}
