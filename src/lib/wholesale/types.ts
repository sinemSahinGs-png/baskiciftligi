import type { WholesalePackageSku } from "@/lib/wholesale/packages";

export const WHOLESALE_PAYMENT_STATES = [
  "payment_pending",
  "paid",
  "payment_failed",
  "cancelled",
  "refunded",
] as const;

export type WholesalePaymentState = (typeof WHOLESALE_PAYMENT_STATES)[number];

export const WHOLESALE_FULFILMENT_STATES = [
  "new",
  "preparing",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type WholesaleFulfilmentState =
  (typeof WHOLESALE_FULFILMENT_STATES)[number];

export const WHOLESALE_INVOICE_TYPES = ["bireysel", "kurumsal"] as const;
export type WholesaleInvoiceType = (typeof WHOLESALE_INVOICE_TYPES)[number];

export const LIVE_FULFILMENT_STATES: readonly WholesaleFulfilmentState[] = [
  "preparing",
  "ready_to_ship",
  "shipped",
  "delivered",
];

export interface WholesaleAddress {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  line: string;
}

export interface WholesaleInvoice {
  type: WholesaleInvoiceType;
  sameAsShipping: boolean;
  companyName: string | null;
  taxOffice: string | null;
  taxNumber: string | null;
  address: WholesaleAddress | null;
}

export interface WholesaleAgreementAcceptance {
  versionId: string;
  title: string;
  acceptedAt: string;
  snapshot: string;
}

export interface WholesaleOrder {
  id: string;
  orderNumber: string;
  merchantOid: string;
  idempotencyKey: string;
  userId: string | null;
  guestEmail: string;
  trackingTokenHash: string;
  packageSku: WholesalePackageSku;
  unitQuantity: number;
  unitGrossMinor: number;
  productGrossMinor: number;
  standGrossMinor: number;
  shippingGrossMinor: number;
  grandTotalMinor: number;
  currency: "TRY";
  paymentState: WholesalePaymentState;
  fulfilmentState: WholesaleFulfilmentState;
  customer: WholesaleAddress;
  shippingAddress: WholesaleAddress;
  invoice: WholesaleInvoice;
  customerNote: string | null;
  agreements: WholesaleAgreementAcceptance[];
  paytrPaymentType: string | null;
  paytrPaidAmountMinor: number | null;
  paytrFailureCode: string | null;
  paytrFailureMessage: string | null;
  paytrTestMode: boolean;
  shipmentCarrier: string | null;
  shipmentTrackingNumber: string | null;
  shipmentTrackingUrl: string | null;
  emailStatus: "unconfigured" | "queued" | "sent" | "failed" | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export interface WholesaleStatusEvent {
  id: string;
  orderId: string;
  previousPaymentState: WholesalePaymentState | null;
  newPaymentState: WholesalePaymentState | null;
  previousFulfilmentState: WholesaleFulfilmentState | null;
  newFulfilmentState: WholesaleFulfilmentState | null;
  actor: string;
  note: string | null;
  createdAt: string;
}

export interface WholesaleSettings {
  shippingGrossMinor: number | null;
  shippingUpdatedAt: string | null;
  shippingUpdatedBy: string | null;
  checkoutOpen: boolean;
  paytrTestCallbackAt: string | null;
}

export interface WholesaleListFilters {
  query?: string;
  paymentState?: WholesalePaymentState | "";
  fulfilmentState?: WholesaleFulfilmentState | "";
  packageSku?: WholesalePackageSku | "";
  from?: string;
  to?: string;
}

export const STOCK_POLICY = {
  id: "wholesale-lighters-v1",
  deductBeforePayment: false,
  reservation: "none_until_paid",
  assortment: "mixed_from_available_models_after_payment",
  summary:
    "Stok ödemeden önce düşülmez ve rezervasyon tutulmaz. Karışık paket, ödeme onayından sonra mevcut modellerden hazırlanır.",
} as const;
