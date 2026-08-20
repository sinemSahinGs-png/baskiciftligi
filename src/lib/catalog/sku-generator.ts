const CATEGORY_CODE: Record<string, string> = {
  dekor: "DEK",
  "masa-ustu": "MSU",
  "ev-yasam": "EVY",
  hediye: "HED",
  prototip: "PRO",
  kurumsal: "KUR",
};

export function categoryCodeFromSlug(slug: string): string {
  const mapped = CATEGORY_CODE[slug];
  if (mapped) {
    return mapped;
  }

  const letters = slug
    .replace(/[^a-z0-9-]/g, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);

  if (letters.length >= 2) {
    return letters.padEnd(3, "X");
  }

  return slug.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "X");
}

export function formatProductSku(prefix: string, sequence: number): string {
  const safePrefix = prefix.replace(/[^A-Z0-9]/g, "").slice(0, 6) || "GEN";
  const safeSequence = Math.max(1, Math.min(sequence, 999));
  return `BC-${safePrefix}-${String(safeSequence).padStart(3, "0")}`;
}

export function buildSuggestedSku(
  categorySlugs: string[],
  sequence: number,
): string {
  const prefix = categoryCodeFromSlug(categorySlugs[0] ?? "genel");
  return formatProductSku(prefix, sequence);
}

export function parseSkuSequence(sku: string, prefix: string): number | null {
  const pattern = new RegExp(
    `^BC-${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d{3})$`,
    "i",
  );
  const match = sku.trim().match(pattern);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}
