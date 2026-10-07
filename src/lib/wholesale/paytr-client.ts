import "server-only";

import {
  getPaytrCredentials,
  isPaytrTestMode,
  isWholesalePaytrStubEnabled,
  siteOrigin,
} from "@/lib/wholesale/credentials";
import {
  buildPaytrIframeToken,
  encodePaytrBasket,
} from "@/lib/wholesale/paytr";
import type { WholesaleOrder } from "@/lib/wholesale/types";

const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

export interface PaytrIframeResult {
  iframeToken: string;
  iframeSrc: string;
  testMode: boolean;
  stub: boolean;
}

export async function requestPaytrIframeToken(input: {
  order: WholesaleOrder;
  userIp: string;
}): Promise<PaytrIframeResult> {
  const testMode = isPaytrTestMode();
  if (isWholesalePaytrStubEnabled()) {
    const stubToken = `stub-${input.order.merchantOid}`;
    return {
      iframeToken: stubToken,
      iframeSrc: `/odeme/paytr-stub?oid=${encodeURIComponent(input.order.merchantOid)}`,
      testMode: true,
      stub: true,
    };
  }

  const credentials = getPaytrCredentials();
  if (!credentials) {
    throw new Error("PAYTR_UNCONFIGURED");
  }

  const userBasket = encodePaytrBasket({
    sku: input.order.packageSku,
    quantity: input.order.unitQuantity,
    unitGrossMinor: input.order.unitGrossMinor,
    productGrossMinor: input.order.productGrossMinor,
    standGrossMinor: input.order.standGrossMinor,
    shippingGrossMinor: input.order.shippingGrossMinor,
    grandTotalMinor: input.order.grandTotalMinor,
    currency: input.order.currency,
  });
  const testModeFlag = testMode ? "1" : "0";
  const tokenFields = {
    merchantId: credentials.merchantId,
    userIp: input.userIp,
    merchantOid: input.order.merchantOid,
    email: input.order.customer.email,
    paymentAmountMinor: input.order.grandTotalMinor,
    userBasketB64: userBasket,
    noInstallment: "1" as const,
    maxInstallment: "0",
    currency: "TL" as const,
    testMode: testModeFlag as "0" | "1",
  };
  const paytrToken = buildPaytrIframeToken(tokenFields, credentials);
  const origin = siteOrigin();
  const body = new URLSearchParams({
    merchant_id: credentials.merchantId,
    merchant_key: credentials.merchantKey,
    merchant_salt: credentials.merchantSalt,
    email: input.order.customer.email,
    payment_amount: String(input.order.grandTotalMinor),
    merchant_oid: input.order.merchantOid,
    user_name: input.order.customer.fullName,
    user_address: `${input.order.shippingAddress.line}, ${input.order.shippingAddress.district} / ${input.order.shippingAddress.city}`,
    user_phone: input.order.customer.phone,
    merchant_ok_url: `${origin}/odeme/basarili?order=${encodeURIComponent(input.order.orderNumber)}`,
    merchant_fail_url: `${origin}/odeme/basarisiz?order=${encodeURIComponent(input.order.orderNumber)}`,
    user_basket: userBasket,
    user_ip: input.userIp,
    timeout_limit: "30",
    debug_on: testMode ? "1" : "0",
    test_mode: testModeFlag,
    lang: "tr",
    no_installment: "1",
    max_installment: "0",
    currency: "TL",
    paytr_token: paytrToken,
  });

  let response: Response;
  try {
    response = await fetch(PAYTR_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    throw new Error("PAYTR_NETWORK");
  }

  const raw = await response.text();
  let parsed: { status?: string; token?: string; reason?: string };
  try {
    parsed = JSON.parse(raw) as { status?: string; token?: string; reason?: string };
  } catch {
    throw new Error("PAYTR_BAD_RESPONSE");
  }

  if (parsed.status !== "success" || !parsed.token) {
    throw new Error("PAYTR_TOKEN_DENIED");
  }

  return {
    iframeToken: parsed.token,
    iframeSrc: `https://www.paytr.com/odeme/guvenli/${parsed.token}`,
    testMode,
    stub: false,
  };
}
