import { assertMinorUnits } from "@/lib/money";

export const WHOLESALE_CURRENCY = "TRY" as const;
export const WHOLESALE_PAYTR_CURRENCY = "TL" as const;

export const WHOLESALE_PACKAGE_SKUS = ["WS-LIGHTER-50", "WS-LIGHTER-100"] as const;

export type WholesalePackageSku = (typeof WHOLESALE_PACKAGE_SKUS)[number];

export const STAND_LINE_SKU = "WS-STAND-GIFT";
export const STAND_LINE_GROSS_MINOR = 0;

/**
 * Customer-facing package totals are VAT-inclusive gross amounts.
 * Catalog manufacturing defaults use 20% (2000 bps) but that rate is not a
 * verified wholesale invoice configuration. Net/VAT split is not activated.
 */
export const WHOLESALE_VAT_STATUS = {
  catalogDefaultBps: 2000,
  verifiedForWholesaleInvoice: false,
  note: "Fatura net/KDV kırılımı hukuk ve muhasebe onayı olmadan üretilmez. Müşteriye gösterilen paket tutarları KDV dahil brüt tutardır.",
} as const;

export interface WholesalePackageDefinition {
  sku: WholesalePackageSku;
  quantity: 50 | 100;
  unitGrossMinor: number;
  productGrossMinor: number;
  standGrossMinor: number;
  title: string;
  shortTitle: string;
  cta: string;
  mixedNote: string;
  description: string;
}

export const WHOLESALE_PACKAGES: Record<
  WholesalePackageSku,
  WholesalePackageDefinition
> = {
  "WS-LIGHTER-50": {
    sku: "WS-LIGHTER-50",
    quantity: 50,
    unitGrossMinor: 3_500,
    productGrossMinor: 175_000,
    standGrossMinor: STAND_LINE_GROSS_MINOR,
    title: "50’li Başlangıç Paketi",
    shortTitle: "50’li paket",
    cta: "50’Lİ PAKETİ SEÇ",
    mixedNote: "Karışık modeller, stoktakilerden hazırlanır.",
    description: "50 adet karışık model kaplamalı çakmak",
  },
  "WS-LIGHTER-100": {
    sku: "WS-LIGHTER-100",
    quantity: 100,
    unitGrossMinor: 3_500,
    productGrossMinor: 350_000,
    standGrossMinor: STAND_LINE_GROSS_MINOR,
    title: "100’lü Mağaza Paketi",
    shortTitle: "100’lü paket",
    cta: "100’LÜ PAKETİ SEÇ",
    mixedNote: "Karışık modeller, stoktakilerden hazırlanır.",
    description: "100 adet karışık model kaplamalı çakmak",
  },
};

export function isWholesalePackageSku(value: unknown): value is WholesalePackageSku {
  return (
    typeof value === "string" &&
    (WHOLESALE_PACKAGE_SKUS as readonly string[]).includes(value)
  );
}

export function getWholesalePackage(sku: string): WholesalePackageDefinition {
  if (!isWholesalePackageSku(sku)) {
    throw new Error("UNKNOWN_PACKAGE");
  }
  return WHOLESALE_PACKAGES[sku];
}

export interface WholesaleQuote {
  sku: WholesalePackageSku;
  quantity: number;
  unitGrossMinor: number;
  productGrossMinor: number;
  standGrossMinor: number;
  shippingGrossMinor: number;
  grandTotalMinor: number;
  currency: typeof WHOLESALE_CURRENCY;
}

export function quoteWholesalePackage(
  sku: string,
  shippingGrossMinor: number,
): WholesaleQuote {
  const pack = getWholesalePackage(sku);
  const shipping = assertMinorUnits(shippingGrossMinor);
  if (shipping < 0) {
    throw new RangeError("Kargo tutarı negatif olamaz.");
  }

  const product = assertMinorUnits(pack.productGrossMinor);
  const stand = assertMinorUnits(pack.standGrossMinor);
  const unit = assertMinorUnits(pack.unitGrossMinor);

  if (unit * pack.quantity !== product) {
    throw new Error("Paket fiyatı iç tutarsız.");
  }
  if (stand !== 0) {
    throw new Error("Stand hediye kalemi sıfır olmalıdır.");
  }

  return {
    sku: pack.sku,
    quantity: pack.quantity,
    unitGrossMinor: unit,
    productGrossMinor: product,
    standGrossMinor: stand,
    shippingGrossMinor: shipping,
    grandTotalMinor: assertMinorUnits(product + stand + shipping),
    currency: WHOLESALE_CURRENCY,
  };
}

export function paytrBasketLines(quote: WholesaleQuote) {
  const pack = getWholesalePackage(quote.sku);
  return [
    [pack.description, kurusToPaytrPrice(quote.unitGrossMinor), quote.quantity],
    ["Satış standı (hediye)", kurusToPaytrPrice(quote.standGrossMinor), 1],
    ["Kargo", kurusToPaytrPrice(quote.shippingGrossMinor), 1],
  ] as const;
}

/** PayTR basket unit prices are decimal strings, not floating money math. */
export function kurusToPaytrPrice(minor: number): string {
  assertMinorUnits(minor);
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.trunc(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
}
