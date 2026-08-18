import type { CurrencyCode } from "@/domain/catalog/types";

const tryFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  currencyDisplay: "symbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function assertMinorUnits(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError("Parasal değer güvenli bir tam sayı olmalıdır.");
  }

  return value;
}

export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode = "TRY",
): string {
  assertMinorUnits(amountMinor);

  if (currency !== "TRY") {
    throw new RangeError(`Desteklenmeyen para birimi: ${currency}`);
  }

  return tryFormatter.format(amountMinor / 100);
}

export function calculateDiscountPercentage(
  priceMinor: number,
  compareAtPriceMinor: number | null,
): number | null {
  if (
    compareAtPriceMinor === null ||
    compareAtPriceMinor <= priceMinor ||
    compareAtPriceMinor <= 0
  ) {
    return null;
  }

  return Math.round(((compareAtPriceMinor - priceMinor) / compareAtPriceMinor) * 100);
}
