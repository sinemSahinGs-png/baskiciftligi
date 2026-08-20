export type PriceParseResult =
  | { ok: true; minor: number | null }
  | { ok: false; error: string };

function countMatches(value: string, pattern: RegExp): number {
  return (value.match(pattern) ?? []).length;
}

export function parseEditablePriceInput(value: string): PriceParseResult {
  const compact = value.trim().replace(/\s/g, "");

  if (!compact) {
    return { ok: true, minor: null };
  }

  if (compact.startsWith("-")) {
    return { ok: false, error: "Tutar negatif olamaz." };
  }

  const commaCount = countMatches(compact, /,/g);
  const dotCount = countMatches(compact, /\./g);

  if (commaCount > 1 || dotCount > 1) {
    return { ok: false, error: "Geçerli bir tutar girin." };
  }

  if (commaCount === 1 && dotCount === 1) {
    const lastComma = compact.lastIndexOf(",");
    const lastDot = compact.lastIndexOf(".");
    if (lastComma > lastDot) {
      const fraction = compact.slice(lastComma + 1);
      if (fraction.length > 2) {
        return {
          ok: false,
          error: "En fazla iki ondalık basamak girebilirsiniz.",
        };
      }
    } else {
      const fraction = compact.slice(lastDot + 1);
      if (fraction.length > 2) {
        return {
          ok: false,
          error: "En fazla iki ondalık basamak girebilirsiniz.",
        };
      }
    }
  } else if (commaCount === 1) {
    const fraction = compact.slice(compact.indexOf(",") + 1);
    if (fraction.length > 2) {
      return {
        ok: false,
        error: "En fazla iki ondalık basamak girebilirsiniz.",
      };
    }
  } else if (dotCount === 1) {
    const fraction = compact.slice(compact.indexOf(".") + 1);
    if (fraction.length > 2) {
      return {
        ok: false,
        error: "En fazla iki ondalık basamak girebilirsiniz.",
      };
    }
  }

  let normalized: string;
  if (commaCount === 1 && dotCount === 1) {
    normalized =
      compact.lastIndexOf(",") > compact.lastIndexOf(".")
        ? compact.replace(/\./g, "").replace(",", ".")
        : compact.replace(/,/g, "");
  } else if (commaCount === 1) {
    normalized = compact.replace(",", ".");
  } else {
    normalized = compact;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { ok: false, error: "Geçerli bir tutar girin." };
  }

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = fraction.padEnd(2, "0");
  const minor = Number(whole) * 100 + Number(paddedFraction);

  if (!Number.isSafeInteger(minor)) {
    return { ok: false, error: "Tutar desteklenen sınırı aşıyor." };
  }

  if (minor < 0) {
    return { ok: false, error: "Tutar negatif olamaz." };
  }

  return { ok: true, minor };
}

export function minorUnitsToEditingString(
  minor: number | null | undefined,
): string {
  if (minor === null || minor === undefined) {
    return "";
  }

  if (minor === 0) {
    return "";
  }

  if (minor % 100 === 0) {
    return String(minor / 100);
  }

  return (minor / 100).toFixed(2).replace(".", ",");
}

export function draftsMeaningfullyDiffer(
  server: { priceMinor: number | null },
  local: { priceMinor?: number | null },
): boolean {
  const serverPrice = server.priceMinor ?? 0;
  const localPrice = local.priceMinor ?? 0;
  return serverPrice !== localPrice;
}
