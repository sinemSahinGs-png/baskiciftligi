import "server-only";

import { randomUUID } from "node:crypto";

import type {
  AdminCatalogOverview,
  AdminCatalogSummary,
  AdminCategory,
  AdminCollection,
} from "@/domain/catalog/admin-types";
import type {
  Product,
  ProductMedia,
  ProductVariant,
} from "@/domain/catalog/types";
import { isDevelopmentDemoMode, isSupabaseConfigured } from "@/lib/env";
import {
  loadDemoCatalog,
  removeDemoCategory,
  removeDemoProduct,
  upsertDemoCategory,
  upsertDemoProduct,
} from "@/lib/demo/catalog-store";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CategoryFormInput,
  ProductFormInput,
} from "@/lib/validation/catalog";
import {
  parseMediaPresentation,
  parseProductPresentation,
  serializeMediaPresentation,
} from "@/domain/catalog/media";
import { isStagePreset } from "@/domain/visual/stages";

type DatabaseError = { message: string } | null;

interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
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
  product_variants: Array<{
    id: string;
    sku: string;
    title: string;
    barcode: string | null;
    status: Product["status"];
    price_minor: number;
    attributes: unknown;
    is_default: boolean;
    position: number;
    inventory_levels: Array<{
      on_hand_quantity: number;
      reserved_quantity: number;
    }> | null;
  }> | null;
  product_images: Array<{
    id: string;
    storage_path: string | null;
    external_url: string | null;
    alt_text: string | null;
    position: number;
  }> | null;
  product_categories:
    | Array<{
        categories: { slug: string } | Array<{ slug: string }> | null;
      }>
    | null;
  collection_products:
    | Array<{
        collections: { slug: string } | Array<{ slug: string }> | null;
      }>
    | null;
}

interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: AdminCategory["status"];
  position: number;
}

interface AdminCollectionRow {
  id: string;
  name: string;
  slug: string;
}

function assertDatabaseResult(
  error: DatabaseError,
  operation: string,
): asserts error is null {
  if (error) {
    throw new Error(`${operation}: ${error.message}`);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberMetadata(
  metadata: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringMetadata(
  metadata: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = metadata[key];
  return typeof value === "string" ? value : fallback;
}

function relationSlug(
  value: { slug: string } | Array<{ slug: string }> | null,
): string | null {
  return Array.isArray(value) ? (value[0]?.slug ?? null) : (value?.slug ?? null);
}

function mapDatabaseProduct(row: AdminProductRow): Product {
  const metadata = asRecord(row.metadata);
  const sortedVariants = [...(row.product_variants ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const defaultVariant =
    sortedVariants.find((variant) => variant.is_default) ?? sortedVariants[0];
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
      colorName: stringMetadata(attributes, "color_name") || undefined,
      colorHex: stringMetadata(attributes, "color_hex") || undefined,
      priceAdjustmentMinor: numberMetadata(
        attributes,
        "price_adjustment_minor",
        Number(variant.price_minor) - Number(row.base_price_minor),
      ),
      inventoryQuantity,
      isActive: variant.status === "active",
    };
  });
  const media: ProductMedia[] = [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image, index) => ({
      id: image.id,
      type: "image" as const,
      url:
        image.external_url ??
        (image.storage_path ? `/${image.storage_path.replace(/^\/+/, "")}` : ""),
      alt: image.alt_text ?? row.name,
      position: image.position,
      ...parseMediaPresentation(metadata, index),
    }))
    .filter((image) => Boolean(image.url));
  const rawBadges = metadata.badges;
  const badges = Array.isArray(rawBadges)
    ? rawBadges.filter(
        (badge): badge is Product["badges"][number] =>
          badge === "new" || badge === "bestseller" || badge === "limited",
      )
    : [];
  const kind =
    metadata.kind === "ready_stock" ? "ready_stock" : "made_to_order";

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    status: row.status,
    kind,
    priceMinor: Number(row.base_price_minor),
    compareAtPriceMinor:
      row.compare_at_price_minor === null
        ? null
        : Number(row.compare_at_price_minor),
    currency: row.currency,
    sku:
      stringMetadata(metadata, "sku") ??
      defaultVariant?.sku ??
      `PRODUCT-${row.id.slice(0, 8)}`,
    barcode:
      stringMetadata(metadata, "barcode") ||
      defaultVariant?.barcode ||
      undefined,
    inventoryQuantity: variants.reduce(
      (total, variant) => total + variant.inventoryQuantity,
      0,
    ),
    productionLeadTimeDays: {
      min: numberMetadata(metadata, "lead_time_min_days", 0),
      max: numberMetadata(metadata, "lead_time_max_days", 0),
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
    isDemo: false,
  };
}

async function requiredSupabase() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase katalog bağlantısı yapılandırılmadı.");
  }

  return supabase;
}

async function listSupabaseProducts(): Promise<Product[]> {
  const supabase = await requiredSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, short_description, description, status, base_price_minor, compare_at_price_minor, currency, metadata, seo_title, seo_description, published_at, product_variants(id, sku, title, barcode, status, price_minor, attributes, is_default, position, inventory_levels(on_hand_quantity, reserved_quantity)), product_images(id, storage_path, external_url, alt_text, position), product_categories(categories(slug)), collection_products(collections(slug))",
    )
    .order("updated_at", { ascending: false });

  assertDatabaseResult(error, "Ürünler okunamadı");
  return ((data ?? []) as unknown as AdminProductRow[]).map(mapDatabaseProduct);
}

async function listSupabaseCategories(): Promise<AdminCategory[]> {
  const supabase = await requiredSupabase();
  const [categoryResult, assignmentResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, description, image_url, status, position")
      .order("position")
      .order("name"),
    supabase.from("product_categories").select("category_id"),
  ]);

  assertDatabaseResult(categoryResult.error, "Kategoriler okunamadı");
  assertDatabaseResult(
    assignmentResult.error,
    "Kategori ürün sayıları okunamadı",
  );

  const counts = new Map<string, number>();
  for (const assignment of assignmentResult.data ?? []) {
    counts.set(
      assignment.category_id,
      (counts.get(assignment.category_id) ?? 0) + 1,
    );
  }

  return (
    (categoryResult.data ?? []) as unknown as AdminCategoryRow[]
  ).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.image_url ?? "",
    status: category.status,
    position: category.position,
    productCount: counts.get(category.id) ?? 0,
  }));
}

async function listSupabaseCollections(): Promise<AdminCollection[]> {
  const supabase = await requiredSupabase();
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, slug")
    .order("name");

  assertDatabaseResult(error, "Koleksiyonlar okunamadı");
  return ((data ?? []) as unknown as AdminCollectionRow[]).map((collection) => ({
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
  }));
}

async function demoOverview(): Promise<AdminCatalogOverview> {
  const snapshot = await loadDemoCatalog();

  return {
    mode: "demo",
    products: snapshot.products,
    categories: snapshot.categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      status: "published",
      position: category.position,
      productCount: snapshot.products.filter((product) =>
        product.categorySlugs.includes(category.slug),
      ).length,
    })),
    collections: snapshot.collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
    })),
  };
}

export async function getAdminCatalogOverview(): Promise<AdminCatalogOverview> {
  if (isDevelopmentDemoMode) {
    return demoOverview();
  }

  if (!isSupabaseConfigured) {
    return {
      mode: "supabase",
      products: [],
      categories: [],
      collections: [],
    };
  }

  const [products, categories, collections] = await Promise.all([
    listSupabaseProducts(),
    listSupabaseCategories(),
    listSupabaseCollections(),
  ]);

  return { mode: "supabase", products, categories, collections };
}

export async function listAdminProducts(): Promise<Product[]> {
  return (await getAdminCatalogOverview()).products;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  return (await getAdminCatalogOverview()).categories;
}

export async function listAdminCollections(): Promise<AdminCollection[]> {
  return (await getAdminCatalogOverview()).collections;
}

export async function getAdminProductById(
  productId: string,
): Promise<Product | undefined> {
  if (isDevelopmentDemoMode) {
    return (await loadDemoCatalog()).products.find(
      (product) => product.id === productId,
    );
  }

  const supabase = await requiredSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, short_description, description, status, base_price_minor, compare_at_price_minor, currency, metadata, seo_title, seo_description, published_at, product_variants(id, sku, title, barcode, status, price_minor, attributes, is_default, position, inventory_levels(on_hand_quantity, reserved_quantity)), product_images(id, storage_path, external_url, alt_text, position), product_categories(categories(slug)), collection_products(collections(slug))",
    )
    .eq("id", productId)
    .maybeSingle();

  assertDatabaseResult(error, "Ürün okunamadı");
  return data ? mapDatabaseProduct(data as unknown as AdminProductRow) : undefined;
}

function productFromInput(input: ProductFormInput, productId: string): Product {
  const variants = input.variants.map((variant) => ({
    id: variant.id ?? `demo-variant-${randomUUID()}`,
    name: variant.name,
    sku: variant.sku,
    colorName: variant.colorName || undefined,
    colorHex: variant.colorHex || undefined,
    priceAdjustmentMinor: variant.priceAdjustmentMinor,
    inventoryQuantity: variant.inventoryQuantity,
    isActive: variant.isActive,
  }));

  return {
    id: productId,
    name: input.name,
    slug: input.slug,
    shortDescription: input.shortDescription,
    description: input.description,
    status: input.status,
    kind: input.kind,
    priceMinor: input.priceMinor,
    compareAtPriceMinor: input.compareAtPriceMinor,
    currency: "TRY",
    sku: input.sku,
    barcode: input.barcode || undefined,
    inventoryQuantity: variants.reduce(
      (total, variant) => total + variant.inventoryQuantity,
      0,
    ),
    productionLeadTimeDays: {
      min: input.productionLeadTimeMinDays,
      max: input.productionLeadTimeMaxDays,
    },
    categorySlugs: input.categorySlugs,
    collectionSlugs: input.collectionSlugs,
    media: input.media.map((media, index) => ({
      id: media.id ?? `demo-media-${randomUUID()}`,
      type: media.role === "video" ? "video" : "image",
      url: media.url,
      alt: media.alt,
      position: index,
      role: media.role,
      objectPosition: media.objectPosition || undefined,
      mobileObjectPosition: media.mobileObjectPosition || undefined,
      isolated: media.isolated,
    })),
    presentation: {
      stagePreset: isStagePreset(input.stagePreset)
        ? input.stagePreset
        : undefined,
      objectPosition: input.objectPosition || undefined,
      mobileObjectPosition: input.mobileObjectPosition || undefined,
      isolated: input.isolated,
    },
    variants,
    badges: input.badges,
    featured: input.featured,
    seoTitle: input.seoTitle || input.name,
    seoDescription: input.seoDescription || input.shortDescription,
    publishedAt: input.publishedAt || null,
    isDemo: true,
  };
}

async function saveDemoProduct(input: ProductFormInput): Promise<Product> {
  const snapshot = await loadDemoCatalog();
  const productId = input.id ?? `demo-product-${randomUUID()}`;
  const slugOwner = snapshot.products.find(
    (product) => product.slug === input.slug && product.id !== productId,
  );

  if (slugOwner) {
    throw new Error("Bu slug başka bir demo üründe kullanılıyor.");
  }

  return upsertDemoProduct(productFromInput(input, productId));
}

async function getInventoryLocationId(): Promise<string> {
  const supabase = await requiredSupabase();
  const locationResult = await supabase
    .from("inventory_locations")
    .select("id")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  assertDatabaseResult(locationResult.error, "Stok konumu okunamadı");

  if (locationResult.data?.id) {
    return locationResult.data.id;
  }

  const locationId = randomUUID();
  const createResult = await supabase.from("inventory_locations").insert({
    id: locationId,
    code: "MAIN",
    name: "Ana stok",
    is_active: true,
  });

  assertDatabaseResult(createResult.error, "Ana stok konumu oluşturulamadı");
  return locationId;
}

async function replaceProductAssignments(
  productId: string,
  categorySlugs: string[],
  collectionSlugs: string[],
): Promise<void> {
  const supabase = await requiredSupabase();
  const [categoryResult, collectionResult, currentCategories, currentCollections] =
    await Promise.all([
      categorySlugs.length
        ? supabase.from("categories").select("id, slug").in("slug", categorySlugs)
        : Promise.resolve({ data: [], error: null }),
      collectionSlugs.length
        ? supabase
            .from("collections")
            .select("id, slug")
            .in("slug", collectionSlugs)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("product_categories")
        .select("category_id")
        .eq("product_id", productId),
      supabase
        .from("collection_products")
        .select("collection_id")
        .eq("product_id", productId),
    ]);

  assertDatabaseResult(categoryResult.error, "Kategori atamaları doğrulanamadı");
  assertDatabaseResult(
    collectionResult.error,
    "Koleksiyon atamaları doğrulanamadı",
  );
  assertDatabaseResult(
    currentCategories.error,
    "Mevcut kategori atamaları okunamadı",
  );
  assertDatabaseResult(
    currentCollections.error,
    "Mevcut koleksiyon atamaları okunamadı",
  );

  if ((categoryResult.data ?? []).length !== categorySlugs.length) {
    throw new Error("Seçilen kategorilerden en az biri bulunamadı.");
  }

  if ((collectionResult.data ?? []).length !== collectionSlugs.length) {
    throw new Error("Seçilen koleksiyonlardan en az biri bulunamadı.");
  }

  const categoryIds = (categoryResult.data ?? []).map((category) => category.id);
  const collectionIds = (collectionResult.data ?? []).map(
    (collection) => collection.id,
  );

  const clearPrimaryResult = await supabase
    .from("product_categories")
    .update({ is_primary: false })
    .eq("product_id", productId);
  assertDatabaseResult(
    clearPrimaryResult.error,
    "Kategori birincil işaretleri temizlenemedi",
  );

  if (categoryIds.length) {
    const categoryUpsert = await supabase.from("product_categories").upsert(
      categoryIds.map((categoryId, index) => ({
        product_id: productId,
        category_id: categoryId,
        is_primary: false,
        position: index,
      })),
      { onConflict: "product_id,category_id" },
    );
    assertDatabaseResult(categoryUpsert.error, "Kategori atamaları yazılamadı");

    const primaryUpdate = await supabase
      .from("product_categories")
      .update({ is_primary: true })
      .eq("product_id", productId)
      .eq("category_id", categoryIds[0]);
    assertDatabaseResult(primaryUpdate.error, "Birincil kategori ayarlanamadı");
  }

  if (collectionIds.length) {
    const collectionUpsert = await supabase.from("collection_products").upsert(
      collectionIds.map((collectionId, index) => ({
        product_id: productId,
        collection_id: collectionId,
        position: index,
      })),
      { onConflict: "collection_id,product_id" },
    );
    assertDatabaseResult(
      collectionUpsert.error,
      "Koleksiyon atamaları yazılamadı",
    );
  }

  const staleCategoryIds = (currentCategories.data ?? [])
    .map((item) => item.category_id)
    .filter((id) => !categoryIds.includes(id));
  const staleCollectionIds = (currentCollections.data ?? [])
    .map((item) => item.collection_id)
    .filter((id) => !collectionIds.includes(id));

  if (staleCategoryIds.length) {
    const deleteResult = await supabase
      .from("product_categories")
      .delete()
      .eq("product_id", productId)
      .in("category_id", staleCategoryIds);
    assertDatabaseResult(
      deleteResult.error,
      "Eski kategori atamaları silinemedi",
    );
  }

  if (staleCollectionIds.length) {
    const deleteResult = await supabase
      .from("collection_products")
      .delete()
      .eq("product_id", productId)
      .in("collection_id", staleCollectionIds);
    assertDatabaseResult(
      deleteResult.error,
      "Eski koleksiyon atamaları silinemedi",
    );
  }
}

async function saveSupabaseProduct(input: ProductFormInput): Promise<Product> {
  const supabase = await requiredSupabase();
  const productId = input.id ?? randomUUID();
  const productResult = await supabase.from("products").upsert(
    {
      id: productId,
      name: input.name,
      slug: input.slug,
      short_description: input.shortDescription,
      description: input.description,
      product_type: "physical",
      status: input.status,
      base_price_minor: input.priceMinor,
      compare_at_price_minor: input.compareAtPriceMinor,
      currency: "TRY",
      metadata: {
        kind: input.kind,
        sku: input.sku,
        barcode: input.barcode || null,
        featured: input.featured,
        badges: input.badges,
        lead_time_min_days: input.productionLeadTimeMinDays,
        lead_time_max_days: input.productionLeadTimeMaxDays,
        stage_preset: input.stagePreset || null,
        object_position: input.objectPosition || null,
        mobile_object_position: input.mobileObjectPosition || null,
        isolated: input.isolated ?? null,
        media: serializeMediaPresentation(
          input.media.map((media, index) => ({
            id: media.id ?? String(index),
            type: media.role === "video" ? "video" : "image",
            url: media.url,
            alt: media.alt,
            position: index,
            role: media.role,
            objectPosition: media.objectPosition || undefined,
            mobileObjectPosition: media.mobileObjectPosition || undefined,
            isolated: media.isolated,
          })),
        ),
      },
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
      published_at: input.publishedAt || null,
    },
    { onConflict: "id" },
  );
  assertDatabaseResult(productResult.error, "Ürün kaydı yazılamadı");

  const [existingVariantResult, existingImageResult] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId),
    supabase.from("product_images").select("id").eq("product_id", productId),
  ]);
  assertDatabaseResult(
    existingVariantResult.error,
    "Mevcut varyantlar okunamadı",
  );
  assertDatabaseResult(
    existingImageResult.error,
    "Mevcut görseller okunamadı",
  );

  const clearDefaultResult = await supabase
    .from("product_variants")
    .update({ is_default: false })
    .eq("product_id", productId);
  assertDatabaseResult(
    clearDefaultResult.error,
    "Varsayılan varyant işareti temizlenemedi",
  );

  const variantRows = input.variants.map((variant, index) => ({
    id: variant.id ?? randomUUID(),
    product_id: productId,
    sku: variant.sku,
    title: variant.name,
    barcode: index === 0 && input.barcode ? input.barcode : null,
    status: variant.isActive
      ? input.status === "active"
        ? "active"
        : "draft"
      : "archived",
    price_minor: input.priceMinor + variant.priceAdjustmentMinor,
    compare_at_price_minor:
      input.compareAtPriceMinor === null
        ? null
        : input.compareAtPriceMinor + variant.priceAdjustmentMinor,
    currency: "TRY",
    attributes: {
      color_name: variant.colorName || null,
      color_hex: variant.colorHex || null,
      price_adjustment_minor: variant.priceAdjustmentMinor,
    },
    is_default: index === 0,
    position: index,
  }));
  const variantUpsert = await supabase
    .from("product_variants")
    .upsert(variantRows, { onConflict: "id" });
  assertDatabaseResult(variantUpsert.error, "Varyantlar yazılamadı");

  const locationId = await getInventoryLocationId();
  const inventoryUpsert = await supabase.from("inventory_levels").upsert(
    variantRows.map((variant, index) => ({
      variant_id: variant.id,
      location_id: locationId,
      on_hand_quantity: input.variants[index].inventoryQuantity,
      reserved_quantity: 0,
      reorder_point: 0,
    })),
    { onConflict: "variant_id,location_id" },
  );
  assertDatabaseResult(inventoryUpsert.error, "Stok seviyeleri yazılamadı");

  const clearPrimaryImage = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  assertDatabaseResult(
    clearPrimaryImage.error,
    "Birincil görsel işareti temizlenemedi",
  );

  const imageRows = input.media.map((media, index) => ({
    id: media.id ?? randomUUID(),
    product_id: productId,
    variant_id: null,
    storage_path: null,
    external_url: media.url,
    alt_text: media.alt,
    position: index,
    is_primary: index === 0,
    is_public: true,
  }));

  if (imageRows.length) {
    const imageUpsert = await supabase
      .from("product_images")
      .upsert(imageRows, { onConflict: "id" });
    assertDatabaseResult(imageUpsert.error, "Görsel URL’leri yazılamadı");
  }

  await replaceProductAssignments(
    productId,
    input.categorySlugs,
    input.collectionSlugs,
  );

  const staleVariantIds = (existingVariantResult.data ?? [])
    .map((variant) => variant.id)
    .filter((id) => !variantRows.some((variant) => variant.id === id));
  const staleImageIds = (existingImageResult.data ?? [])
    .map((image) => image.id)
    .filter((id) => !imageRows.some((image) => image.id === id));

  if (staleVariantIds.length) {
    const staleVariantDelete = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId)
      .in("id", staleVariantIds);
    assertDatabaseResult(
      staleVariantDelete.error,
      "Kaldırılan varyantlar silinemedi",
    );
  }

  if (staleImageIds.length) {
    const staleImageDelete = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId)
      .in("id", staleImageIds);
    assertDatabaseResult(
      staleImageDelete.error,
      "Kaldırılan görseller silinemedi",
    );
  }

  const saved = await getAdminProductById(productId);

  if (!saved) {
    throw new Error("Ürün yazıldı ancak yeniden okunamadı.");
  }

  return saved;
}

export async function saveAdminProduct(
  input: ProductFormInput,
): Promise<Product> {
  return isDevelopmentDemoMode
    ? saveDemoProduct(input)
    : saveSupabaseProduct(input);
}

export async function archiveAdminProduct(productId: string): Promise<void> {
  if (isDevelopmentDemoMode) {
    const product = (await loadDemoCatalog()).products.find(
      (item) => item.id === productId,
    );

    if (!product) {
      throw new Error("Arşivlenecek ürün bulunamadı.");
    }

    await upsertDemoProduct({ ...product, status: "archived" });
    return;
  }

  const supabase = await requiredSupabase();
  const productResult = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId);
  assertDatabaseResult(productResult.error, "Ürün arşivlenemedi");

  const variantResult = await supabase
    .from("product_variants")
    .update({ status: "archived" })
    .eq("product_id", productId);
  assertDatabaseResult(variantResult.error, "Varyantlar arşivlenemedi");
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  if (isDevelopmentDemoMode) {
    await removeDemoProduct(productId);
    return;
  }

  const supabase = await requiredSupabase();
  const result = await supabase.from("products").delete().eq("id", productId);
  assertDatabaseResult(result.error, "Ürün silinemedi");
}

export async function duplicateAdminProduct(productId: string): Promise<Product> {
  const source = await getAdminProductById(productId);

  if (!source) {
    throw new Error("Çoğaltılacak ürün bulunamadı.");
  }

  const suffix = Date.now().toString(36);
  const input: ProductFormInput = {
    name: `${source.name} — Kopya`,
    slug: `${source.slug.replace(/-kopya-[a-z0-9]+$/, "")}-kopya-${suffix}`.slice(
      0,
      180,
    ),
    shortDescription: source.shortDescription,
    description: source.description,
    status: "draft",
    kind: source.kind,
    priceMinor: source.priceMinor,
    compareAtPriceMinor: source.compareAtPriceMinor,
    sku: `${source.sku}-COPY-${suffix}`.slice(0, 80),
    barcode: "",
    productionLeadTimeMinDays: source.productionLeadTimeDays.min,
    productionLeadTimeMaxDays: source.productionLeadTimeDays.max,
    categorySlugs: source.categorySlugs,
    collectionSlugs: source.collectionSlugs,
    featured: false,
    badges: source.badges,
    publishedAt: "",
    seoTitle: `${source.seoTitle} — Kopya`.slice(0, 180),
    seoDescription: source.seoDescription,
    media: source.media.map((media, index) => ({
      url: media.url,
      alt: media.alt,
      position: index,
    })),
    variants: source.variants.map((variant) => ({
      name: variant.name,
      sku: `${variant.sku}-COPY-${suffix}`.slice(0, 80),
      colorName: variant.colorName ?? "",
      colorHex: variant.colorHex ?? "",
      priceAdjustmentMinor: variant.priceAdjustmentMinor,
      inventoryQuantity: variant.inventoryQuantity,
      isActive: false,
    })),
  };

  return saveAdminProduct(input);
}

async function saveDemoCategory(
  input: CategoryFormInput,
): Promise<AdminCategory> {
  const snapshot = await loadDemoCatalog();
  const categoryId = input.id ?? `demo-category-${randomUUID()}`;
  const existing = snapshot.categories.find(
    (category) => category.id === categoryId,
  );
  const slugOwner = snapshot.categories.find(
    (category) => category.slug === input.slug && category.id !== categoryId,
  );

  if (slugOwner) {
    throw new Error("Bu slug başka bir demo kategoride kullanılıyor.");
  }

  const category = await upsertDemoCategory({
    id: categoryId,
    name: input.name,
    slug: input.slug,
    description: input.description,
    imageUrl: input.imageUrl || existing?.imageUrl || "",
    eyebrow: existing?.eyebrow ?? "Koleksiyon",
    isFeatured: existing?.isFeatured ?? false,
    position: input.position,
    isDemo: true,
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    status: input.status,
    position: category.position,
    productCount: snapshot.products.filter((product) =>
      product.categorySlugs.includes(category.slug),
    ).length,
  };
}

async function saveSupabaseCategory(
  input: CategoryFormInput,
): Promise<AdminCategory> {
  const supabase = await requiredSupabase();
  const categoryId = input.id ?? randomUUID();
  const currentResult = await supabase
    .from("categories")
    .select("published_at")
    .eq("id", categoryId)
    .maybeSingle();
  assertDatabaseResult(currentResult.error, "Kategori durumu okunamadı");

  const categoryResult = await supabase.from("categories").upsert(
    {
      id: categoryId,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      image_url: input.imageUrl || null,
      status: input.status,
      position: input.position,
      published_at:
        input.status === "published"
          ? (currentResult.data?.published_at ?? new Date().toISOString())
          : null,
    },
    { onConflict: "id" },
  );
  assertDatabaseResult(categoryResult.error, "Kategori kaydedilemedi");

  return {
    id: categoryId,
    name: input.name,
    slug: input.slug,
    description: input.description,
    imageUrl: input.imageUrl,
    status: input.status,
    position: input.position,
    productCount: 0,
  };
}

export async function saveAdminCategory(
  input: CategoryFormInput,
): Promise<AdminCategory> {
  return isDevelopmentDemoMode
    ? saveDemoCategory(input)
    : saveSupabaseCategory(input);
}

export async function deleteAdminCategory(categoryId: string): Promise<void> {
  if (isDevelopmentDemoMode) {
    await removeDemoCategory(categoryId);
    return;
  }

  const supabase = await requiredSupabase();
  const assignmentResult = await supabase
    .from("product_categories")
    .select("product_id", { count: "exact", head: true })
    .eq("category_id", categoryId);
  assertDatabaseResult(
    assignmentResult.error,
    "Kategori kullanımı doğrulanamadı",
  );

  if ((assignmentResult.count ?? 0) > 0) {
    throw new Error("Ürün atanmış bir kategori silinemez.");
  }

  const deleteResult = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);
  assertDatabaseResult(deleteResult.error, "Kategori silinemedi");
}

export async function getAdminCatalogSummary(): Promise<AdminCatalogSummary> {
  const overview = await getAdminCatalogOverview();

  return {
    productCount: overview.products.length,
    activeProductCount: overview.products.filter(
      (product) => product.status === "active",
    ).length,
    draftProductCount: overview.products.filter(
      (product) => product.status === "draft",
    ).length,
    archivedProductCount: overview.products.filter(
      (product) => product.status === "archived",
    ).length,
    categoryCount: overview.categories.length,
    lowStockVariantCount: overview.products.flatMap(
      (product) => product.variants,
    ).filter((variant) => variant.isActive && variant.inventoryQuantity <= 5)
      .length,
  };
}
