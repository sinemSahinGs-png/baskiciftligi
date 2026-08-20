import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import type {
  Announcement,
  CatalogSnapshot,
  Category,
  Collection,
  Material,
  Product,
  ProductMedia,
  ProductPage,
  ProductQuery,
  ProductVariant,
} from "@/domain/catalog/types";
import { productionVitrineSnapshot } from "@/lib/catalog/production-vitrine";
import { resolveCategoryCoverUrl } from "@/lib/catalog/category-cover";
import { catalogMediaPublicUrl } from "@/lib/catalog/media-url";
import { resolveCatalogSource } from "@/lib/catalog/source";
import { productMatchesSearch } from "@/lib/catalog/storefront-listing";
import { isPubliclyVisibleProduct } from "@/lib/catalog/visibility";
import { loadDemoCatalog } from "@/lib/demo/catalog-store";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { extraCatalogFieldsFromMetadata } from "@/domain/catalog/catalog-fields";
import {
  parseMediaPresentation,
  parseProductPresentation,
} from "@/domain/catalog/media";

type JsonRecord = Record<string, unknown>;

type DatabaseProductRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  status: Product["status"];
  base_price_minor: number;
  compare_at_price_minor: number | null;
  currency: "TRY";
  metadata: unknown;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  product_images: Array<{
    id: string;
    storage_path: string | null;
    external_url: string | null;
    alt_text: string | null;
    position: number;
  }> | null;
  product_variants: Array<{
    id: string;
    title: string;
    sku: string;
    barcode: string | null;
    status: Product["status"];
    price_minor: number;
    attributes: unknown;
    is_default: boolean;
    position: number;
    inventory_levels: Array<{ on_hand_quantity: number }> | null;
  }> | null;
  product_categories:
    | Array<{ categories: { slug: string } | Array<{ slug: string }> | null }>
    | null;
  collection_products:
    | Array<{ collections: { slug: string } | Array<{ slug: string }> | null }>
    | null;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function numberField(record: JsonRecord, key: string, fallback: number) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringField(record: JsonRecord, key: string, fallback = "") {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function relationSlug(
  relation: { slug: string } | Array<{ slug: string }> | null,
): string | null {
  if (Array.isArray(relation)) {
    return relation[0]?.slug ?? null;
  }

  return relation?.slug ?? null;
}

function mapProduct(row: DatabaseProductRow): Product {
  const metadata = asRecord(row.metadata);
  const sortedVariants = [...(row.product_variants ?? [])].sort(
    (left, right) => left.position - right.position,
  );
  const defaultVariant =
    sortedVariants.find((variant) => variant.is_default) ?? sortedVariants[0];
  const media: ProductMedia[] = [...(row.product_images ?? [])]
    .sort((left, right) => left.position - right.position)
    .map((item, index) => ({
      id: item.id,
      type: "image" as const,
      url:
        item.external_url ??
        (item.storage_path
          ? catalogMediaPublicUrl(item.storage_path)
          : ""),
      alt: item.alt_text ?? row.name,
      position: item.position,
      ...parseMediaPresentation(metadata, index),
    }))
    .filter((item) => Boolean(item.url));
  const variants: ProductVariant[] = sortedVariants.map((variant) => {
    const attributes = asRecord(variant.attributes);
    const inventoryQuantity = (variant.inventory_levels ?? []).reduce(
      (total, level) => total + Number(level.on_hand_quantity ?? 0),
      0,
    );

    return {
      id: variant.id,
      name: variant.title,
      sku: variant.sku,
      colorName: stringField(attributes, "color_name") || undefined,
      colorHex: stringField(attributes, "color_hex") || undefined,
      priceAdjustmentMinor: numberField(
        attributes,
        "price_adjustment_minor",
        Number(variant.price_minor) - Number(row.base_price_minor),
      ),
      inventoryQuantity,
      isActive: variant.status === "active",
    };
  });
  const rawBadges = metadata.badges;
  const badges = Array.isArray(rawBadges)
    ? rawBadges.filter(
        (badge): badge is Product["badges"][number] =>
          badge === "new" || badge === "bestseller" || badge === "limited",
      )
    : [];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    status: row.status,
    kind:
      metadata.kind === "ready_stock" || metadata.kind === "hybrid"
        ? metadata.kind
        : "made_to_order",
    priceMinor: Number(row.base_price_minor),
    compareAtPriceMinor:
      row.compare_at_price_minor === null
        ? null
        : Number(row.compare_at_price_minor),
    currency: row.currency,
    sku:
      stringField(metadata, "sku") ||
      defaultVariant?.sku ||
      `PRODUCT-${row.id.slice(0, 8)}`,
    barcode:
      stringField(metadata, "barcode") ||
      defaultVariant?.barcode ||
      undefined,
    inventoryQuantity: variants.reduce(
      (total, variant) => total + variant.inventoryQuantity,
      0,
    ),
    productionLeadTimeDays: {
      min: numberField(metadata, "lead_time_min_days", 0),
      max: numberField(metadata, "lead_time_max_days", 0),
    },
    categorySlugs: (row.product_categories ?? [])
      .map((item) => relationSlug(item.categories))
      .filter((slug): slug is string => Boolean(slug)),
    collectionSlugs: (row.collection_products ?? [])
      .map((item) => relationSlug(item.collections))
      .filter((slug): slug is string => Boolean(slug)),
    media,
    presentation: parseProductPresentation(metadata),
    variants,
    badges,
    featured: metadata.featured === true,
    seoTitle: row.seo_title ?? row.name,
    seoDescription: row.seo_description ?? row.short_description ?? "",
    publishedAt: row.published_at,
    isDemo: metadata.demo === true,
    ...extraCatalogFieldsFromMetadata(metadata),
  };
}

async function loadSupabaseCatalog(): Promise<CatalogSnapshot> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase katalog adaptörü yapılandırılmadı.");
  }

  const [productsResult, categoriesResult, collectionsResult, materialsResult, settingsResult] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, slug, name, short_description, description, status, base_price_minor, compare_at_price_minor, currency, metadata, seo_title, seo_description, published_at, product_images(id, storage_path, external_url, alt_text, position), product_variants(id, title, sku, barcode, status, price_minor, attributes, is_default, position, inventory_levels(on_hand_quantity)), product_categories(categories(slug)), collection_products(collections(slug))",
        )
        .in("status", ["active", "scheduled"])
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false }),
      supabase
        .from("categories")
        .select("id, slug, name, description, image_url, seo_title, position")
        .eq("status", "published")
        .order("position"),
      supabase
        .from("collections")
        .select(
          "id, slug, name, description, collection_products(products(slug))",
        )
        .eq("status", "published")
        .order("name"),
      supabase
        .from("materials")
        .select(
          "id, slug, name, material_type, description, properties, position, material_colors(is_active, colors(name, hex_code))",
        )
        .eq("status", "active")
        .order("position"),
      supabase
        .from("site_settings")
        .select("key, value")
        .eq("is_public", true),
    ]);

  const firstError = [
    productsResult.error,
    categoriesResult.error,
    collectionsResult.error,
    materialsResult.error,
    settingsResult.error,
  ].find(Boolean);

  if (firstError) {
    const missingSchema =
      firstError.code === "PGRST205" ||
      /schema cache/i.test(firstError.message);
    if (missingSchema) {
      return productionVitrineSnapshot();
    }
    throw new Error(`Katalog sorgusu başarısız: ${firstError.message}`);
  }

  const products = (
    (productsResult.data ?? []) as unknown as DatabaseProductRow[]
  ).map(mapProduct);

  const categories = (categoriesResult.data ?? []).map(
    (row): Category => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? "",
      imageUrl: resolveCategoryCoverUrl(row.slug, row.image_url),
      objectPosition: "50% 50%",
      imageFit: "cover",
      imageScale: 100,
      eyebrow: row.seo_title ?? "Koleksiyon",
      isFeatured: row.position <= 5,
      position: row.position,
      isDemo: false,
    }),
  );

  const collections = (collectionsResult.data ?? []).map(
    (row): Collection => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? "",
      productSlugs: (
        (row.collection_products ?? []) as unknown as Array<{
          products: { slug: string } | Array<{ slug: string }> | null;
        }>
      )
        .map((item) => relationSlug(item.products))
        .filter((slug): slug is string => Boolean(slug)),
      isDemo: false,
    }),
  );

  const materials = (materialsResult.data ?? []).map((row): Material => {
    const properties = asRecord(row.properties);
    const materialType = String(row.material_type ?? "").toUpperCase();
    const technology: Material["technology"] =
      stringField(properties, "technology") === "SLA" ||
      materialType.includes("RESIN") ||
      materialType.includes("RECINE")
        ? "SLA"
        : "FDM";
    const useCases = Array.isArray(properties.use_cases)
      ? properties.use_cases.map(String)
      : [];
    const colors = (
      (row.material_colors ?? []) as Array<{
        is_active: boolean;
        colors:
          | { name: string; hex_code: string }
          | Array<{ name: string; hex_code: string }>
          | null;
      }>
    )
      .filter((item) => item.is_active)
      .map((item) => {
        const color = Array.isArray(item.colors) ? item.colors[0] : item.colors;
        return color ? { name: color.name, hex: color.hex_code } : null;
      })
      .filter((color): color is { name: string; hex: string } => Boolean(color));

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      technology,
      summary: row.description ?? "",
      useCases,
      durability: numberField(properties, "durability", 3),
      surfaceQuality: numberField(properties, "surface_quality", 3),
      heatResistance: numberField(properties, "heat_resistance", 3),
      flexibility: numberField(properties, "flexibility", 2),
      suitability:
        (properties.suitability as Material["suitability"] | undefined) ??
        "İç mekân",
      colors,
      isDemo: properties.demo === true,
    };
  });

  const announcements = (settingsResult.data ?? []).flatMap(
    (row, index): Announcement[] => {
      const value = asRecord(row.value);
      const message =
        typeof row.value === "string"
          ? row.value
          : stringField(value, "message");

      if (
        !message ||
        (row.key !== "homepage.demo_notice" &&
          !String(row.key).startsWith("announcements."))
      ) {
        return [];
      }

      if (value.enabled === false) {
        return [];
      }

      return [
        {
          id: row.key,
          message,
          href: typeof value.href === "string" ? value.href : undefined,
          isActive: true,
          position: index + 1,
        },
      ];
    },
  );

  return {
    products,
    categories,
    collections,
    materials,
    announcements,
    updatedAt: new Date().toISOString(),
  };
}

const loadSupabaseCatalogCached = unstable_cache(
  loadSupabaseCatalog,
  ["public-catalog-v1"],
  {
    tags: ["catalog"],
    revalidate: 300,
  },
);

const getCatalogSnapshotCached = cache(async (): Promise<CatalogSnapshot> => {
  const source = resolveCatalogSource({
    supabaseConfigured: isSupabaseConfigured,
    nodeEnv: process.env.NODE_ENV,
  });

  if (source === "supabase") {
    return loadSupabaseCatalogCached();
  }

  if (source === "development-demo") {
    return loadDemoCatalog();
  }

  return productionVitrineSnapshot();
});

export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  return getCatalogSnapshotCached();
}

export async function listProducts(query: ProductQuery = {}): Promise<Product[]> {
  const snapshot = await getCatalogSnapshot();
  const normalizedQuery = query.query?.trim().toLocaleLowerCase("tr-TR");
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? query.limit ?? 48));
  const start = query.page ? (page - 1) * pageSize : 0;
  const end = query.page
    ? start + pageSize
    : (query.limit ?? Number.POSITIVE_INFINITY);

  return snapshot.products
    .filter((product) => query.includeDrafts || isPubliclyVisibleProduct(product))
    .filter(
      (product) =>
        !query.category || product.categorySlugs.includes(query.category),
    )
    .filter(
      (product) =>
        !query.collection || product.collectionSlugs.includes(query.collection),
    )
    .filter(
      (product) => !normalizedQuery || productMatchesSearch(product, normalizedQuery),
    )
    .filter((product) => !query.kind || product.kind === query.kind)
    .filter(
      (product) =>
        !query.color ||
        product.variants.some(
          (variant) =>
            variant.colorName?.toLocaleLowerCase("tr-TR") ===
            query.color?.toLocaleLowerCase("tr-TR"),
        ),
    )
    .filter(
      (product) =>
        query.minPriceMinor === undefined ||
        product.priceMinor >= query.minPriceMinor,
    )
    .filter(
      (product) =>
        query.maxPriceMinor === undefined ||
        product.priceMinor <= query.maxPriceMinor,
    )
    .filter(
      (product) =>
        query.inStock !== true ||
        product.inventoryQuantity > 0 ||
        product.variants.some((variant) => variant.inventoryQuantity > 0),
    )
    .filter(
      (product) =>
        query.personalizable !== true ||
        product.collectionSlugs.includes("sana-ozel") ||
        product.categorySlugs.includes("kisiye-ozel-urunler"),
    )
    .filter(
      (product) =>
        query.maxLeadDays === undefined ||
        product.productionLeadTimeDays.max <= query.maxLeadDays,
    )
    .filter(
      (product) =>
        !query.material ||
        `${product.name} ${product.description} ${product.shortDescription}`
          .toLocaleLowerCase("tr-TR")
          .includes(query.material.toLocaleLowerCase("tr-TR")),
    )
    .sort((left, right) => {
      switch (query.sort) {
        case "price_asc":
          return left.priceMinor - right.priceMinor;
        case "price_desc":
          return right.priceMinor - left.priceMinor;
        case "newest":
          return (right.publishedAt ?? "").localeCompare(left.publishedAt ?? "");
        case "featured":
          return Number(right.featured) - Number(left.featured);
        default:
          return 0;
      }
    })
    .slice(start, end);
}

export async function listProductsPage(
  query: ProductQuery = {},
): Promise<ProductPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 24));
  const allMatches = await listProducts({
    ...query,
    page: undefined,
    pageSize: undefined,
    limit: undefined,
  });
  const start = (page - 1) * pageSize;

  return {
    items: allMatches.slice(start, start + pageSize),
    page,
    pageSize,
    total: allMatches.length,
    pageCount: Math.max(1, Math.ceil(allMatches.length / pageSize)),
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.products.find(
    (product) => product.slug === slug && isPubliclyVisibleProduct(product),
  );
}

export async function getProductById(
  id: string,
): Promise<Product | undefined> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.products.find((product) => product.id === id);
}

export async function listCategories(): Promise<Category[]> {
  return (await getCatalogSnapshot()).categories;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | undefined> {
  return (await getCatalogSnapshot()).categories.find(
    (category) => category.slug === slug,
  );
}

export async function listCollections(): Promise<Collection[]> {
  return (await getCatalogSnapshot()).collections;
}

export async function listMaterials(): Promise<Material[]> {
  return (await getCatalogSnapshot()).materials;
}

export async function getMaterialBySlug(
  slug: string,
): Promise<Material | undefined> {
  return (await getCatalogSnapshot()).materials.find(
    (material) => material.slug === slug,
  );
}
