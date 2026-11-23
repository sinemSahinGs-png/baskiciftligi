import { slugifyTurkish } from "@/lib/catalog/slug";
import type { ProductFormInput } from "@/lib/validation/catalog";

export type TrendyolRawProduct = {
  contentId?: number | string;
  productMainId?: string;
  id?: string;
  title?: string;
  description?: string;
  images?: Array<{ url?: string } | string>;
  brand?: { name?: string } | string;
  listPrice?: number;
  salePrice?: number;
  quantity?: number;
  barcode?: string;
  stockCode?: string;
  onSale?: boolean;
  approved?: boolean;
  archived?: boolean;
  blacklisted?: boolean;
  productUrl?: string;
  vatRate?: number;
  price?: { salePrice?: number; listPrice?: number };
  stock?: { quantity?: number };
  variants?: TrendyolRawVariant[];
};

export type TrendyolRawVariant = {
  barcode?: string;
  stockCode?: string;
  onSale?: boolean;
  locked?: boolean;
  archived?: boolean;
  blacklisted?: boolean;
  productUrl?: string;
  vatRate?: number;
  stock?: { quantity?: number };
  quantity?: number;
  price?: { salePrice?: number; listPrice?: number };
  salePrice?: number;
  listPrice?: number;
  attributes?: Array<{ attributeName?: string; attributeValue?: string }>;
};

export type MappedTrendyolProduct = ProductFormInput & {
  trendyolContentId: string;
};

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function trendyolImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `https://cdn.dsmcdn.com${path}`;
}

function collectImageCandidates(raw: TrendyolRawProduct): string[] {
  const bags: unknown[] = [
    raw.images,
    (raw as { imageUrls?: unknown }).imageUrls,
    (raw as { productImages?: unknown }).productImages,
    (raw as { pictures?: unknown }).pictures,
  ];
  const urls: string[] = [];
  for (const bag of bags) {
    if (!Array.isArray(bag)) continue;
    for (const item of bag) {
      if (typeof item === "string") urls.push(item);
      else if (item && typeof item === "object") {
        const record = item as { url?: string; imageUrl?: string };
        urls.push(record.url ?? record.imageUrl ?? "");
      }
    }
  }
  return [...new Set(urls.map(trendyolImageUrl).filter((url) => url.startsWith("https://")))];
}

export function sanitizeCatalogSku(raw: string, seed: string): string {
  const cleaned = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  if (cleaned.length >= 1) return cleaned;
  const fallback = `TY-${seed}`
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return fallback.length >= 1 ? fallback : "TY-ITEM";
}

export function tryToMinor(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100);
}

function variantName(variant: TrendyolRawVariant, fallback: string, index: number): string {
  const size = variant.attributes?.find((item) =>
    /beden|boyut|size/i.test(item.attributeName ?? ""),
  )?.attributeValue;
  const color = variant.attributes?.find((item) =>
    /renk|color/i.test(item.attributeName ?? ""),
  )?.attributeValue;
  return [color, size].filter(Boolean).join(" / ") || fallback || `Varyant ${index + 1}`;
}

function usableVariant(variant: TrendyolRawVariant): boolean {
  if (variant.locked || variant.archived || variant.blacklisted) return false;
  return Boolean(variant.barcode || variant.stockCode);
}

export function mapTrendyolProduct(raw: TrendyolRawProduct): MappedTrendyolProduct | null {
  if (raw.archived || raw.blacklisted || raw.approved === false) {
    return null;
  }

  const title = stripHtml(raw.title ?? "").slice(0, 180);
  if (title.length < 2) return null;

  const variantsRaw = (raw.variants?.length ? raw.variants : [raw]).filter(usableVariant);
  if (variantsRaw.length === 0) return null;

  const images = collectImageCandidates(raw);
  const descriptionSource = stripHtml(raw.description ?? title);
  const description =
    descriptionSource.length >= 20 ? descriptionSource.slice(0, 20_000) : `${title} — OCTO STUDIO Trendyol ürünü.`;
  const shortDescription = (descriptionSource || title).slice(0, 320);
  const paddedShort =
    shortDescription.length >= 10 ? shortDescription : `${title} ürünü`.slice(0, 320);

  const usedSkus = new Set<string>();
  const mappedVariants = variantsRaw.map((variant, index) => {
    const sale = variant.price?.salePrice ?? variant.salePrice ?? raw.salePrice ?? 0;
    const list = variant.price?.listPrice ?? variant.listPrice ?? raw.listPrice ?? sale;
    const qty = variant.stock?.quantity ?? variant.quantity ?? raw.quantity ?? 0;
    const barcode = String(variant.barcode ?? raw.barcode ?? "").trim();
    const seed = barcode || String(raw.contentId ?? raw.productMainId ?? raw.id ?? index + 1);
    let sku = sanitizeCatalogSku(
      String(variant.stockCode || barcode || ""),
      seed,
    );
    const skuKey = sku.toLocaleLowerCase("tr-TR");
    if (usedSkus.has(skuKey)) {
      sku = sanitizeCatalogSku(`${sku}-${index + 1}`, `${seed}-${index + 1}`);
    }
    usedSkus.add(sku.toLocaleLowerCase("tr-TR"));
    return {
      name: variantName(variant, title, index).slice(0, 180),
      sku,
      barcode: barcode.slice(0, 80),
      colorName: "",
      colorHex: "" as const,
      priceAdjustmentMinor: 0,
      inventoryQuantity: Math.max(0, Math.min(10_000_000, Math.trunc(qty))),
      isActive: variant.onSale !== false && (raw.onSale !== false || Boolean(raw.variants)),
      saleMinor: tryToMinor(sale),
      listMinor: tryToMinor(list),
      onSale: variant.onSale !== false,
      productUrl: variant.productUrl ?? raw.productUrl ?? "",
      vatRate: variant.vatRate ?? raw.vatRate,
    };
  });

  const priced = mappedVariants.filter((item) => item.saleMinor > 0);
  const base = priced[0] ?? mappedVariants[0];
  if (!base) return null;

  const onSale =
    base.saleMinor > 0 && mappedVariants.some((item) => item.onSale);
  const contentId = String(raw.contentId ?? raw.productMainId ?? raw.id ?? base.barcode);
  const slugBase = slugifyTurkish(title) || `trendyol-${contentId}`.toLowerCase();
  const slug = `${slugBase}`.slice(0, 160);
  const vat = typeof base.vatRate === "number" && base.vatRate > 0
    ? Math.round(base.vatRate * 100)
    : 2000;

  return {
    trendyolContentId: contentId,
    name: title,
    slug,
    shortDescription: paddedShort,
    description,
    status: onSale ? "active" : "draft",
    kind: "ready_stock",
    priceMinor: base.saleMinor,
    compareAtPriceMinor:
      base.listMinor > base.saleMinor ? base.listMinor : null,
    sku: base.sku,
    barcode: base.barcode,
    productionLeadTimeMinDays: 2,
    productionLeadTimeMaxDays: 7,
    categorySlugs: [],
    collectionSlugs: [],
    featured: false,
    vatRateBps: Math.min(10_000, Math.max(0, vat)),
    inventoryPolicy: "deny",
    materialCode: "",
    searchVisible: true,
    noindex: false,
    canonicalUrl: (base.productUrl ?? "").startsWith("https://") ? base.productUrl : "",
    badges: [],
    publishedAt: onSale ? new Date().toISOString() : "",
    seoTitle: title,
    seoDescription: paddedShort,
    media: images.slice(0, 12).map((url, index) => ({
      url,
      alt: title.slice(0, 180),
      position: index,
      role: index === 0 ? ("primary" as const) : ("gallery" as const),
    })),
    variants: mappedVariants.map((item) => ({
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      colorName: "",
      colorHex: "",
      priceAdjustmentMinor: item.saleMinor - base.saleMinor,
      inventoryQuantity: item.inventoryQuantity,
      isActive: item.isActive,
    })),
  };
}
