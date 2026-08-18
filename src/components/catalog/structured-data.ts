import type { Product } from "@/domain/catalog/types";
import { siteConfig } from "@/config/site";

export function absoluteSiteUrl(pathOrUrl: string): string {
  try {
    return new URL(pathOrUrl, siteConfig.url).toString();
  } catch {
    return siteConfig.url;
  }
}

function offerForProduct(
  product: Product,
  variant?: Product["variants"][number],
) {
  const availableQuantity = variant
    ? variant.inventoryQuantity
    : product.inventoryQuantity;

  return {
    "@type": "Offer",
    url: absoluteSiteUrl(
      `/urun/${product.slug}${variant ? `?variant=${encodeURIComponent(variant.id)}` : ""}`,
    ),
    priceCurrency: product.currency,
    price: (
      (product.priceMinor + (variant?.priceAdjustmentMinor ?? 0)) /
      100
    ).toFixed(2),
    availability:
      availableQuantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
  };
}

export function createProductStructuredData(product: Product) {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const offers =
    activeVariants.length > 0
      ? activeVariants.map((variant) => offerForProduct(product, variant))
      : offerForProduct(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteSiteUrl(`/urun/${product.slug}#product`),
    url: absoluteSiteUrl(`/urun/${product.slug}`),
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.media
      .filter((item) => item.type === "image")
      .map((item) => absoluteSiteUrl(item.url)),
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers,
    ...(product.isDemo
      ? {
          additionalProperty: {
            "@type": "PropertyValue",
            name: "Kayıt türü",
            value: "Demo ürün",
          },
        }
      : {}),
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
