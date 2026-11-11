import { randomBytes } from "node:crypto";

import { getCatalogSnapshot } from "@/domain/catalog/repository";
import {
  catalogForCartPricing,
  priceCart,
  type CartInputLine,
} from "@/domain/commerce/cart-pricing";
import { computeCartShippingMinor } from "@/domain/commerce/shipping-policy";
import { pricedManufacturingLine } from "@/domain/commerce/manufacturing-cart";
import {
  getManufacturingQuote,
  getQuoteRevocation,
} from "@/domain/manufacturing/repository";
import { getManufacturingActor, ownsRecord } from "@/lib/manufacturing/session";
import { assertMinorUnits } from "@/lib/money";
import { kurusToPaytrPrice } from "@/lib/wholesale/packages";
import {
  buildPaytrIframeToken,
} from "@/lib/wholesale/paytr";
import {
  getPaytrCredentials,
  isPaytrTestMode,
  isWholesalePaytrStubEnabled,
  siteOrigin,
} from "@/lib/wholesale/credentials";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { STORE_AGREEMENT_VERSIONS } from "@/lib/store-checkout/agreements";

export class StoreCheckoutError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "StoreCheckoutError";
  }
}

export interface StoreCheckoutInput {
  lines: CartInputLine[];
  fullName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  note?: string;
  acceptPreliminary: boolean;
  acceptDistance: boolean;
  acceptPrivacy: boolean;
}

function merchantOid() {
  return `ST${Date.now().toString(36).toUpperCase()}${randomBytes(8).toString("hex").toUpperCase()}`;
}

export async function priceStoreCart(lines: CartInputLine[]) {
  const actor = await getManufacturingActor();
  const catalogLines = lines.filter((line) => !line.quoteId);
  const quoteLines = lines.filter((line) => line.quoteId);
  const snapshot = await getCatalogSnapshot();
  const catalogResult = priceCart(
    catalogLines,
    catalogForCartPricing(snapshot.products),
  );
  const manufacturing = [];
  for (const line of quoteLines) {
    const quoteId = line.quoteId!;
    const quote = await getManufacturingQuote(quoteId);
    if (!quote || !ownsRecord(actor, quote)) {
      throw new StoreCheckoutError("INVALID_QUOTE", "Üretim teklifi geçersiz.");
    }
    manufacturing.push(
      pricedManufacturingLine(quote, {
        revoked: Boolean(await getQuoteRevocation(quoteId)),
      }),
    );
  }
  const pricedLines = [...catalogResult.lines, ...manufacturing];
  if (pricedLines.some((line) => !line.isAvailable) || pricedLines.length === 0) {
    throw new StoreCheckoutError("CART_EMPTY", "Sepette ödenebilir ürün yok.");
  }
  const subtotalMinor = assertMinorUnits(
    pricedLines.reduce((sum, line) => sum + line.lineTotalMinor, 0),
  );
  const shippingMinor = computeCartShippingMinor(subtotalMinor);
  return {
    lines: pricedLines,
    subtotalMinor,
    shippingMinor,
    totalMinor: assertMinorUnits(subtotalMinor + shippingMinor),
  };
}

export async function createStoreCheckout(input: {
  payload: StoreCheckoutInput;
  userId: string | null;
  userIp: string;
}) {
  if (
    !input.payload.acceptPreliminary ||
    !input.payload.acceptDistance ||
    !input.payload.acceptPrivacy
  ) {
    throw new StoreCheckoutError("LEGAL", "Sözleşmeleri onaylamanız gerekir.");
  }

  const priced = await priceStoreCart(input.payload.lines);
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    throw new StoreCheckoutError("DB", "Sipariş kaydı için veritabanı yok.");
  }

  const oid = merchantOid();
  const address = {
    fullName: input.payload.fullName,
    email: input.payload.email,
    phone: input.payload.phone,
    city: input.payload.city,
    district: input.payload.district,
    line: input.payload.line,
  };
  const { data: order, error } = await client
    .from("orders")
    .insert({
      user_id:
        input.userId && /^[0-9a-f-]{36}$/i.test(input.userId)
          ? input.userId
          : null,
      status: "pending",
      fulfillment_status: "unfulfilled",
      payment_status: "pending",
      currency: "TRY",
      customer_snapshot: address,
      shipping_address_snapshot: address,
      billing_address_snapshot: address,
      subtotal_minor: priced.subtotalMinor,
      discount_minor: 0,
      shipping_minor: priced.shippingMinor,
      tax_minor: 0,
      total_minor: priced.totalMinor,
      customer_note: input.payload.note || null,
    })
    .select("id, order_number")
    .single();
  if (error || !order) {
    throw new StoreCheckoutError("DB", "Sipariş oluşturulamadı.");
  }

  const items = priced.lines.map((line) => ({
    order_id: order.id,
    product_id:
      !line.quoteId && /^[0-9a-f-]{36}$/i.test(line.productId)
        ? line.productId
        : null,
    variant_id:
      line.variantId && /^[0-9a-f-]{36}$/i.test(line.variantId)
        ? line.variantId
        : null,
    product_name_snapshot: line.name,
    variant_name_snapshot: line.variantName ?? "Standart",
    sku_snapshot: line.quoteId ? `MFQ-${line.quoteId.slice(0, 8)}` : line.slug || line.productId,
    options_snapshot: {
      quoteId: line.quoteId ?? null,
      displayKind: line.displayKind,
      projectSource: line.projectSource ?? null,
    },
    unit_price_minor: line.unitPriceMinor,
    quantity: line.quantity,
    discount_minor: 0,
    tax_minor: 0,
    line_total_minor: line.lineTotalMinor,
  }));
  const { error: itemsError } = await client.from("order_items").insert(items);
  if (itemsError) {
    throw new StoreCheckoutError("DB", "Sipariş kalemleri yazılamadı.");
  }

  const { error: payError } = await client.from("payments").insert({
    order_id: order.id,
    provider: "paytr",
    provider_reference: oid,
    status: "pending",
    amount_minor: priced.totalMinor,
    currency: "TRY",
  });
  if (payError) {
    throw new StoreCheckoutError("DB", "Ödeme kaydı yazılamadı.");
  }

  const origin = siteOrigin().includes("localhost")
    ? "https://baskiciftligi.com"
    : siteOrigin();
  const stub = isWholesalePaytrStubEnabled();
  if (stub) {
    return {
      orderNumber: order.order_number as string,
      merchantOid: oid,
      iframeSrc: `/odeme/paytr-stub?oid=${encodeURIComponent(oid)}`,
      iframeToken: `stub-${oid}`,
      testMode: true,
    };
  }

  const credentials = getPaytrCredentials();
  if (!credentials) {
    throw new StoreCheckoutError("PAYTR_UNCONFIGURED", "Ödeme henüz yapılandırılmamış.");
  }

  const basket = Buffer.from(
    JSON.stringify(
      priced.lines.map((line) => [
        line.name.slice(0, 80),
        kurusToPaytrPrice(line.unitPriceMinor),
        line.quantity,
      ]),
    ),
    "utf8",
  ).toString("base64");
  const testMode = isPaytrTestMode() ? "1" : "0";
  const token = buildPaytrIframeToken(
    {
      merchantId: credentials.merchantId,
      userIp: input.userIp,
      merchantOid: oid,
      email: input.payload.email,
      paymentAmountMinor: priced.totalMinor,
      userBasketB64: basket,
      noInstallment: "1",
      maxInstallment: "0",
      currency: "TL",
      testMode,
    },
    credentials,
  );

  const body = new URLSearchParams({
    merchant_id: credentials.merchantId,
    merchant_key: credentials.merchantKey,
    merchant_salt: credentials.merchantSalt,
    email: input.payload.email,
    payment_amount: String(priced.totalMinor),
    merchant_oid: oid,
    user_name: input.payload.fullName,
    user_address: `${input.payload.line}, ${input.payload.district} / ${input.payload.city}`,
    user_phone: input.payload.phone,
    merchant_ok_url: `${origin}/odeme/basarili?order=${encodeURIComponent(String(order.order_number))}`,
    merchant_fail_url: `${origin}/odeme/basarisiz?order=${encodeURIComponent(String(order.order_number))}`,
    user_basket: basket,
    user_ip: input.userIp,
    timeout_limit: "30",
    debug_on: testMode,
    test_mode: testMode,
    lang: "tr",
    no_installment: "1",
    max_installment: "0",
    currency: "TL",
    paytr_token: token,
  });
  const tokenRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenRes.json().catch(() => null)) as
    | { status?: string; token?: string }
    | null;
  if (!tokenJson?.token || tokenJson.status !== "success") {
    throw new StoreCheckoutError("PAYTR_TOKEN_DENIED", "Ödeme oturumu başlatılamadı.");
  }

  return {
    orderNumber: order.order_number as string,
    merchantOid: oid,
    iframeSrc: `https://www.paytr.com/odeme/guvenli/${tokenJson.token}`,
    iframeToken: tokenJson.token,
    testMode: testMode === "1",
    agreements: STORE_AGREEMENT_VERSIONS,
  };
}

export async function applyStorePaytrCallback(input: {
  merchantOid: string;
  success: boolean;
  amountMinor: number;
}) {
  const client = createServiceRoleSupabaseClient();
  if (!client) return { ok: false as const, reason: "db" };
  const { data: payment } = await client
    .from("payments")
    .select("id, order_id, amount_minor, status")
    .eq("provider", "paytr")
    .eq("provider_reference", input.merchantOid)
    .maybeSingle();
  if (!payment) return { ok: false as const, reason: "unknown_order" };
  if (Number(payment.amount_minor) !== input.amountMinor) {
    return { ok: false as const, reason: "amount_mismatch" };
  }
  if (payment.status === "paid") return { ok: true as const, applied: false };
  const now = new Date().toISOString();
  if (input.success) {
    await client
      .from("payments")
      .update({ status: "paid", paid_at: now, updated_at: now })
      .eq("id", payment.id);
    await client
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed", updated_at: now })
      .eq("id", payment.order_id);
    return { ok: true as const, applied: true };
  }
  await client
    .from("payments")
    .update({ status: "failed", failed_at: now, updated_at: now })
    .eq("id", payment.id);
  await client
    .from("orders")
    .update({ payment_status: "failed", updated_at: now })
    .eq("id", payment.order_id);
  return { ok: true as const, applied: true };
}
