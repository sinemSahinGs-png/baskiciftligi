import { describe, expect, it } from "vitest";

import { createWholesaleCheckoutOrder } from "@/lib/wholesale/checkout-service";
import { createMemoryWholesaleStore } from "@/lib/wholesale/memory-store";
import { wholesaleCheckoutSchema } from "@/lib/wholesale/validation";
import { createIdempotencyKey } from "@/lib/wholesale/ids";

const validPayload = {
  packageSku: "WS-LIGHTER-50" as const,
  customer: {
    fullName: "Ayşe Yılmaz",
    phone: "05551234567",
    email: "ayse@example.com",
    city: "Ankara",
    district: "Çankaya",
    line: "Tunalı Hilmi Cad. No 12 Daire 3",
  },
  sameAsShipping: true,
  invoiceType: "bireysel" as const,
  acceptPreliminary: true as const,
  acceptDistanceSales: true as const,
  acceptPrivacy: true as const,
  idempotencyKey: createIdempotencyKey(),
  clientGrandTotalMinor: 1,
  clientUnitPriceMinor: 99,
};

describe("wholesale checkout service", () => {
  it("ignores client price manipulation", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 10_000 });
    const parsed = wholesaleCheckoutSchema.parse(validPayload);
    const result = await createWholesaleCheckoutOrder({
      store,
      payload: parsed,
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    expect(result.order.grandTotalMinor).toBe(185_000);
    expect(result.order.unitGrossMinor).toBe(3_500);
    expect(result.order.paymentState).toBe("payment_pending");
  });

  it("blocks checkout when shipping is unconfigured", async () => {
    const store = createMemoryWholesaleStore();
    const parsed = wholesaleCheckoutSchema.parse({
      ...validPayload,
      idempotencyKey: createIdempotencyKey(),
    });
    await expect(
      createWholesaleCheckoutOrder({
        store,
        payload: parsed,
        actor: { userId: null, email: null },
        paytrTestMode: true,
      }),
    ).rejects.toMatchObject({
      code: "SHIPPING_UNCONFIGURED",
      message: "Toptan siparişler kısa süre içinde açılacaktır.",
    });
  });

  it("blocks checkout when sales are closed even if shipping exists", async () => {
    const store = createMemoryWholesaleStore({
      shippingGrossMinor: 10_000,
      checkoutOpen: false,
    });
    const parsed = wholesaleCheckoutSchema.parse({
      ...validPayload,
      idempotencyKey: createIdempotencyKey(),
    });
    await expect(
      createWholesaleCheckoutOrder({
        store,
        payload: parsed,
        actor: { userId: null, email: null },
        paytrTestMode: true,
      }),
    ).rejects.toMatchObject({
      code: "CHECKOUT_CLOSED",
      message: "Toptan siparişler kısa süre içinde açılacaktır.",
    });
  });

  it("rejects unknown package SKU at the schema", () => {
    const parsed = wholesaleCheckoutSchema.safeParse({
      ...validPayload,
      packageSku: "WS-NOPE",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid invoice and address fields", () => {
    const parsed = wholesaleCheckoutSchema.safeParse({
      ...validPayload,
      customer: { ...validPayload.customer, line: "kısa", city: "Gotham" },
      invoiceType: "kurumsal",
      companyName: "",
      taxNumber: "123",
    });
    expect(parsed.success).toBe(false);
  });

  it("reuses an existing order for duplicate idempotency keys", async () => {
    const store = createMemoryWholesaleStore({ shippingGrossMinor: 0 });
    const key = createIdempotencyKey();
    const payload = wholesaleCheckoutSchema.parse({
      ...validPayload,
      idempotencyKey: key,
    });
    const first = await createWholesaleCheckoutOrder({
      store,
      payload,
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    const second = await createWholesaleCheckoutOrder({
      store,
      payload,
      actor: { userId: null, email: null },
      paytrTestMode: true,
    });
    expect(second.duplicate).toBe(true);
    expect(second.order.id).toBe(first.order.id);
    expect((await store.listOrders({})).total).toBe(1);
  });
});
