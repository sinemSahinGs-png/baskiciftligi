import { createHmac, timingSafeEqual } from "node:crypto";

import { assertMinorUnits } from "@/lib/money";
import {
  kurusToPaytrPrice,
  paytrBasketLines,
  WHOLESALE_PAYTR_CURRENCY,
  type WholesaleQuote,
} from "@/lib/wholesale/packages";

export interface PaytrCredentials {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
}

export interface PaytrTokenFields {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmountMinor: number;
  userBasketB64: string;
  noInstallment: "0" | "1";
  maxInstallment: string;
  currency: typeof WHOLESALE_PAYTR_CURRENCY;
  testMode: "0" | "1";
}

export function encodePaytrBasket(quote: WholesaleQuote): string {
  const basket = paytrBasketLines(quote).map(([name, price, qty]) => [
    name,
    price,
    qty,
  ]);
  return Buffer.from(JSON.stringify(basket), "utf8").toString("base64");
}

/**
 * Official PayTR iFrame token HMAC field order:
 * merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket
 * + no_installment + max_installment + currency + test_mode + merchant_salt
 * HMAC-SHA256 with merchant_key, Base64 digest.
 * @see https://dev.paytr.com/iframe-api/iframe-api-1-adim
 */
export function buildPaytrIframeToken(
  fields: PaytrTokenFields,
  credentials: PaytrCredentials,
): string {
  if (fields.merchantId !== credentials.merchantId) {
    throw new Error("PayTR mağaza numarası eşleşmiyor.");
  }
  const paymentAmount = String(assertMinorUnits(fields.paymentAmountMinor));
  const hashStr =
    fields.merchantId +
    fields.userIp +
    fields.merchantOid +
    fields.email +
    paymentAmount +
    fields.userBasketB64 +
    fields.noInstallment +
    fields.maxInstallment +
    fields.currency +
    fields.testMode;
  return createHmac("sha256", credentials.merchantKey)
    .update(hashStr + credentials.merchantSalt, "utf8")
    .digest("base64");
}

export interface PaytrCallbackPayload {
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
  paymentType?: string;
  failedReasonCode?: string;
  failedReasonMsg?: string;
  testMode?: string;
}

/**
 * Official callback hash:
 * HMAC-SHA256(merchant_oid + merchant_salt + status + total_amount, merchant_key)
 */
export function buildPaytrCallbackHash(
  payload: Pick<PaytrCallbackPayload, "merchantOid" | "status" | "totalAmount">,
  credentials: PaytrCredentials,
): string {
  const paytrToken =
    payload.merchantOid +
    credentials.merchantSalt +
    payload.status +
    payload.totalAmount;
  return createHmac("sha256", credentials.merchantKey)
    .update(paytrToken, "utf8")
    .digest("base64");
}

export function paytrHashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function verifyPaytrCallbackHash(
  payload: PaytrCallbackPayload,
  credentials: PaytrCredentials,
): boolean {
  const expected = buildPaytrCallbackHash(payload, credentials);
  return paytrHashesEqual(expected, payload.hash);
}

export function parsePaytrTotalAmount(totalAmount: string): number {
  const parsed = Number.parseInt(totalAmount, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("PayTR tutarı geçersiz.");
  }
  return assertMinorUnits(parsed);
}

export { kurusToPaytrPrice };
