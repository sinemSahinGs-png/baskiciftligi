import { assertMinorUnits } from "@/lib/money";

export function liraStringToMinorUnits(value: string): number {
  const compact = value.trim().replace(/\s/g, "");

  if (!compact) {
    throw new RangeError("Tutar boş olamaz.");
  }

  const normalized = compact.includes(",")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact.replace(/,/g, "");

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new RangeError("Geçerli bir tutar girin.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = fraction.padEnd(2, "0").slice(0, 2);
  const signed = whole.startsWith("-");
  const absWhole = whole.replace("-", "");
  const minor = Number(absWhole) * 100 + Number(paddedFraction);

  if (!Number.isSafeInteger(minor)) {
    throw new RangeError("Tutar desteklenen sınırı aşıyor.");
  }

  return assertMinorUnits(signed ? -minor : minor);
}

export function liraInputFromMinorUnits(amountMinor: number): string {
  const minor = assertMinorUnits(amountMinor);
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.trunc(abs / 100);
  const fraction = abs % 100;
  if (fraction === 0) {
    return `${sign}${whole}`;
  }
  return `${sign}${whole}.${String(fraction).padStart(2, "0")}`;
}

export function minorUnitsFromClientNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError("Tutar kuruş cinsinden tam sayı olmalıdır.");
  }

  return assertMinorUnits(value);
}
