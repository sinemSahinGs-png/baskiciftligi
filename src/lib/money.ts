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

/** Round a rational amount to integer kuruş without leaving a float money result. */
export function roundRatioToMinor(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    throw new RangeError("Parasal oran geçersiz.");
  }
  return assertMinorUnits(Math.round(numerator / denominator));
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

/**
 * Parse a Turkish-lira admin input such as `100,00`, `100.00` or `1.750,50`
 * into integer kuruş. Rejects floats by construction.
 */
export function parseTryToMinor(input: string): number | null {
  const raw = input.trim().replace(/[₺\s]/g, "");
  if (!raw) {
    return null;
  }

  let wholePart: string;
  let fractionPart = "00";

  if (raw.includes(",") && raw.includes(".")) {
    const [left, right] = raw.split(",");
    wholePart = left.replace(/\./g, "");
    fractionPart = right ?? "00";
  } else if (raw.includes(",")) {
    const [left, right] = raw.split(",");
    wholePart = left;
    fractionPart = right ?? "00";
  } else if (/^\d+\.\d{1,2}$/.test(raw)) {
    const [left, right] = raw.split(".");
    wholePart = left;
    fractionPart = right ?? "00";
  } else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    wholePart = raw.replace(/\./g, "");
  } else if (/^\d+$/.test(raw)) {
    wholePart = raw;
  } else {
    return null;
  }

  if (!/^\d+$/.test(wholePart) || !/^\d{1,2}$/.test(fractionPart)) {
    return null;
  }

  const whole = Number.parseInt(wholePart, 10);
  const fraction = Number.parseInt(fractionPart.padEnd(2, "0").slice(0, 2), 10);
  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(fraction) || whole < 0) {
    return null;
  }

  return assertMinorUnits(whole * 100 + fraction);
}

export function formatMinorAsTryInput(amountMinor: number): string {
  assertMinorUnits(amountMinor);
  const whole = Math.trunc(amountMinor / 100);
  const fraction = String(Math.abs(amountMinor % 100)).padStart(2, "0");
  return `${whole},${fraction}`;
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
