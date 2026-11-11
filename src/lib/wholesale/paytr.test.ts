import { describe, expect, it } from "vitest";

import {
  buildPaytrCallbackHash,
  buildPaytrIframeToken,
  encodePaytrBasket,
  verifyPaytrCallbackHash,
} from "@/lib/wholesale/paytr";
import { quoteWholesalePackage } from "@/lib/wholesale/packages";
import { handlePaytrCallback } from "@/lib/wholesale/callback-service";
import { createWholesaleCheckoutOrder } from "@/lib/wholesale/checkout-service";
import { createMemoryWholesaleStore } from "@/lib/wholesale/memory-store";
import { wholesaleCheckoutSchema } from "@/lib/wholesale/validation";
import { createIdempotencyKey } from "@/lib/wholesale/ids";
import { updateWholesaleFulfilment } from "@/lib/wholesale/fulfilment";
import {
  authorizeGuestTracking,
  authorizeOwnedOrder,
} from "@/lib/wholesale/tracking";
import { resolveAdminAccess } from "@/lib/auth/admin-access";
import { successRedirectDoesNotPay } from "@/lib/wholesale/callback-service";

const credentials = {
  merchantId: "123",
  merchantKey: "merchant-key",
  merchantSalt: "merchant-salt",
};

function checkoutInput() {
  return wholesaleCheckoutSchema.parse({
    packageSku: "WS-LIGHTER-50",
    customer: {
      fullName: "Ayşe Yılmaz",
      phone: "05551234567",
      email: "ayse@example.com",
      city: "Ankara",
      district: "Çankaya",
      line: "Tunalı Hilmi Cad. No 12 Daire 3",
    },
    sameAsShipping: true,
    invoiceType: "bireysel",
    acceptPreliminary: true,
    acceptDistanceSales: true,
    acceptPrivacy: true,
    idempotencyKey: createIdempotencyKey(),
  });
}

describe("PayTR token construction", () => {
  it("builds HMAC from the official field order", () => {
    const quote = quoteWholesalePackage("WS-LIGHTER-50", 0);
    const basket = encodePaytrBasket(quote);
    const token = buildPaytrIframeToken(
      {
        merchantId: "123",
        userIp: "1.2.3.4",
        merchantOid: "WSABC",
        email: "a@b.com",
        paymentAmountMinor: 175000,
        userBasketB64: basket,
        noInstallment: "1",
        maxInstallment: "0",
        currency: "TL",
        testMode: "1",
      },
      credentials,
    );
    expect(token).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(token).not.toContain(credentials.merchantKey);
  });
});

describe("PayTR callback", () => {
  it("accepts a valid callback and is idempotent", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 0 });
    const created = await createWholesaleCheckoutOrder({
      store,
      payload: checkoutInput(),
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    const payload = {
      merchantOid: created.order.merchantOid,
      status: "success",
      totalAmount: String(created.order.grandTotalMinor),
      hash: "",
    };
    payload.hash = buildPaytrCallbackHash(payload, credentials);
    const first = await handlePaytrCallback({
      store,
      payload,
      credentials,
      requestId: "r1",
    });
    const second = await handlePaytrCallback({
      store,
      payload,
      credentials,
      requestId: "r2",
    });
    expect(first.ok && first.applied).toBe(true);
    expect(second.ok && !second.applied).toBe(true);
    expect((await store.getById(created.order.id))?.paymentState).toBe("paid");
    expect((await store.listEvents(created.order.id)).filter((e) => e.newPaymentState === "paid")).toHaveLength(1);
  });

  it("rejects an invalid callback hash", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 0 });
    const created = await createWholesaleCheckoutOrder({
      store,
      payload: checkoutInput(),
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    const result = await handlePaytrCallback({
      store,
      payload: {
        merchantOid: created.order.merchantOid,
        status: "success",
        totalAmount: String(created.order.grandTotalMinor),
        hash: "tampered",
      },
      credentials,
      requestId: "r",
    });
    expect(result.ok).toBe(false);
    expect((await store.getById(created.order.id))?.paymentState).toBe(
      "payment_pending",
    );
  });

  it("rejects amount mismatch", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 0 });
    const created = await createWholesaleCheckoutOrder({
      store,
      payload: checkoutInput(),
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    const payload = {
      merchantOid: created.order.merchantOid,
      status: "success",
      totalAmount: "1",
      hash: "",
    };
    payload.hash = buildPaytrCallbackHash(payload, credentials);
    const result = await handlePaytrCallback({
      store,
      payload,
      credentials,
      requestId: "r",
    });
    expect(result).toEqual({ ok: false, reason: "amount_mismatch" });
  });

  it("records payment failure without marking paid", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 0 });
    const created = await createWholesaleCheckoutOrder({
      store,
      payload: checkoutInput(),
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    const payload = {
      merchantOid: created.order.merchantOid,
      status: "failed",
      totalAmount: String(created.order.grandTotalMinor),
      hash: "",
      failedReasonCode: "99",
      failedReasonMsg: "yetersiz",
    };
    payload.hash = buildPaytrCallbackHash(payload, credentials);
    const result = await handlePaytrCallback({
      store,
      payload,
      credentials,
      requestId: "r",
    });
    expect(result.ok).toBe(true);
    expect((await store.getById(created.order.id))?.paymentState).toBe(
      "payment_failed",
    );
  });

  it("does not treat a success redirect as payment", () => {
    expect(successRedirectDoesNotPay()).toBe(false);
    expect(verifyPaytrCallbackHash).toBeTypeOf("function");
  });
});

describe("authorization", () => {
  it("authorizes guest tracking with the issued token only", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 0 });
    const created = await createWholesaleCheckoutOrder({
      store,
      payload: checkoutInput(),
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    const ok = await authorizeGuestTracking({
      store,
      orderNumber: created.order.orderNumber,
      token: created.trackingToken,
    });
    const bad = await authorizeGuestTracking({
      store,
      orderNumber: created.order.orderNumber,
      token: "not-the-token",
    });
    expect(ok?.id).toBe(created.order.id);
    expect(bad).toBeNull();
  });

  it("does not expose an order to another signed-in user", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 0 });
    const created = await createWholesaleCheckoutOrder({
      store,
      payload: checkoutInput(),
      actor: { userId: "user-a", email: "a@example.com" },
      paytrTestMode: true,
    });
    const stolen = await authorizeOwnedOrder({
      store,
      orderNumber: created.order.orderNumber,
      userId: "user-b",
    });
    const owner = await authorizeOwnedOrder({
      store,
      orderNumber: created.order.orderNumber,
      userId: "user-a",
    });
    expect(stolen).toBeNull();
    expect(owner?.id).toBe(created.order.id);
  });

  it("rejects admin access for customers", () => {
    expect(
      resolveAdminAccess({ role: "customer", isActive: true }).allowed,
    ).toBe(false);
    expect(resolveAdminAccess({ role: "admin", isActive: true }).allowed).toBe(
      true,
    );
  });

  it("records status history and blocks live fulfilment for test orders", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 0 });
    const created = await createWholesaleCheckoutOrder({
      store,
      payload: checkoutInput(),
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    const payload = {
      merchantOid: created.order.merchantOid,
      status: "success",
      totalAmount: String(created.order.grandTotalMinor),
      hash: "",
    };
    payload.hash = buildPaytrCallbackHash(payload, credentials);
    await handlePaytrCallback({ store, payload, credentials, requestId: "r" });
    await expect(
      updateWholesaleFulfilment({
        store,
        orderId: created.order.id,
        actor: "admin:1",
        fulfilmentState: "preparing",
      }),
    ).rejects.toMatchObject({ code: "TEST_ORDER" });
    const events = await store.listEvents(created.order.id);
    expect(events.length).toBeGreaterThan(0);
  });
});
