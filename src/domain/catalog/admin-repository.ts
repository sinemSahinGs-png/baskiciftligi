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
import { extraCatalogFieldsFromMetadata } from "@/domain/catalog/catalog-fields";
import { resolveCategoryCoverUrl } from "@/lib/catalog/category-cover";
import {
  formatObjectPosition,
  resolveCategoryImagePresentation,
} from "@/lib/catalog/category-image";
import { assertUniqueSlug } from "@/lib/catalog/slug";
import { catalogMediaPublicUrl } from "@/lib/catalog/media-url";
import { removeLocalCatalogMediaForProduct } from "@/lib/catalog/media-store";
import { isDevelopmentDemoMode, isSupabaseConfigured } from "@/lib/env";
import { canViewAdminCatalog } from "@/lib/catalog/authorization";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import {
  loadDemoCatalog,
  removeDemoCategory,
  removeDemoProduct,
  saveDemoCatalog,
  upsertDemoCategory,
  upsertDemoProduct,
} from "@/lib/demo/catalog-store";
import { getViewer } from "@/lib/auth/session";
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
    role?: string | null;
    object_position?: string | null;
    mobile_object_position?: string | null;
    mime_type?: string | null;
    media_type?: string | null;
    variant_id?: string | null;
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
  seo_title?: string | null;
}

function categoryPresentationFields(input?: {
  eyebrow?: string | null;
  imageFit?: string | null;
  imageScale?: number | null;
  objectPosition?: string | null;
}) {
  const presentation = resolveCategoryImagePresentation(input);
  return {
    eyebrow: input?.eyebrow?.trim() || "Koleksiyon",
    imageFit: presentation.fit,
    imageScale: presentation.scale,
    objectPosition: formatObjectPosition(
      presentation.positionX,
      presentation.positionY,
    ),
  };
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
      barcode: variant.barcode || undefined,
      colorName: stringMetadata(attributes, "color_name") || undefined,
      colorHex: stringMetadata(attributes, "color_hex") || undefined,
      material: stringMetadata(attributes, "material") || undefined,
      sizeLabel: stringMetadata(attributes, "size_label") || undefined,
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
    .map((image, index) => {
      const presentation = parseMediaPresentation(metadata, index);
      return {
        id: image.id,
        type: image.media_type === "video" ? ("video" as const) : ("image" as const),
        url:
          image.external_url ??
          (image.storage_path ? catalogMediaPublicUrl(image.storage_path) : ""),
        alt: image.alt_text ?? row.name,
        position: image.position,
        role: (image.role as ProductMedia["role"] | undefined) ?? presentation.role,
        objectPosition: image.object_position ?? presentation.objectPosition,
        mobileObjectPosition:
          image.mobile_object_position ?? presentation.mobileObjectPosition,
        isolated: presentation.isolated,
        variantId: image.variant_id,
        storagePath: image.storage_path,
        mimeType: image.mime_type ?? undefined,
      };
    })
    .filter((image) => Boolean(image.url));
  const rawBadges = metadata.badges;
  const badges = Array.isArray(rawBadges)
    ? rawBadges.filter(
        (badge): badge is Product["badges"][number] =>
          badge === "new" || badge === "bestseller" || badge === "limited",
      )
    : [];
  const kind =
    metadata.kind === "ready_stock" || metadata.kind === "hybrid"
      ? metadata.kind
      : "made_to_order";

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
    ...extraCatalogFieldsFromMetadata(metadata),
  };
}

async function requiredSupabase() {
  const viewer = await getViewer();
  if (!viewer || !canViewAdminCatalog(viewer.role)) {
    throw new Error("Katalog yönetimi için yetkili oturum gerekir.");
  }
  const supabase = createServiceRoleSupabaseClient();
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
      "id, name, slug, short_description, description, status, base_price_minor, compare_at_price_minor, currency, metadata, seo_title, seo_description, published_at, product_variants(id, sku, title, barcode, status, price_minor, attributes, is_default, position, inventory_levels(on_hand_quantity, reserved_quantity)), product_images(id, storage_path, external_url, alt_text, position, role, object_position, mobile_object_position, mime_type, media_type, variant_id), product_categories(categories(slug)), collection_products(collections(slug))",
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
    imageUrl: resolveCategoryCoverUrl(category.slug, category.image_url),
    ...categoryPresentationFields({
      eyebrow: category.seo_title,
    }),
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
      imageUrl: resolveCategoryCoverUrl(category.slug, category.imageUrl),
      ...categoryPresentationFields(category),
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
      mode: "unconfigured",
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
      "id, name, slug, short_description, description, status, base_price_minor, compare_at_price_minor, currency, metadata, seo_title, seo_description, published_at, product_variants(id, sku, title, barcode, status, price_minor, attributes, is_default, position, inventory_levels(on_hand_quantity, reserved_quantity)), product_images(id, storage_path, external_url, alt_text, position, role, object_position, mobile_object_position, mime_type, media_type, variant_id), product_categories(categories(slug)), collection_products(collections(slug))",
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
    barcode: variant.barcode || undefined,
    colorName: variant.colorName || undefined,
    colorHex: variant.colorHex || undefined,
    material: variant.material || undefined,
    sizeLabel: variant.sizeLabel || undefined,
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
      variantId: media.variantId || undefined,
      storagePath: media.storagePath || undefined,
      mimeType: media.mimeType || undefined,
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
    vatRateBps: input.vatRateBps,
    inventoryPolicy: input.inventoryPolicy,
    materialCode: input.materialCode,
    materialSummary: input.materialSummary,
    weightGrams: input.weightGrams,
    widthMm: input.widthMm,
    depthMm: input.depthMm,
    heightMm: input.heightMm,
    personalizationEnabled: input.personalizationEnabled,
    personalizationFields: input.personalizationFields,
    sortOrder: input.sortOrder,
    canonicalUrl: input.canonicalUrl || undefined,
    searchVisible: input.searchVisible,
    noindex: input.noindex,
    modelName: input.modelName || undefined,
    themeStyle: input.themeStyle || undefined,
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

  assertUniqueSlug(
    input.slug,
    snapshot.products.map((product) => ({ id: product.id, slug: product.slug })),
    productId,
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

async function writeCatalogAudit(
  action: string,
  productId: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await requiredSupabase();
  const result = await supabase.rpc("write_catalog_audit", {
    audit_action: action,
    audit_product_id: productId,
    audit_metadata: metadata,
  });

  if (result.error) {
    console.error("[catalog audit]", result.error.message);
  }
}

async function saveSupabaseProduct(input: ProductFormInput): Promise<Product> {
  const supabase = await requiredSupabase();
  const viewer = await getViewer();
  const actorId =
    viewer?.id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      viewer.id,
    )
      ? viewer.id
      : null;
  const productId = input.id ?? randomUUID();
  const existing = await supabase
    .from("products")
    .select("id, status, base_price_minor")
    .eq("id", productId)
    .maybeSingle();
  assertDatabaseResult(existing.error, "Mevcut ürün okunamadı");
  const created = !existing.data;
  const previousPrice = existing.data?.base_price_minor ?? null;
  const previousStatus = existing.data?.status ?? null;
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
      tax_rate_bps: input.vatRateBps ?? 2000,
      sku: input.sku,
      barcode: input.barcode || null,
      featured: input.featured,
      bestseller: input.badges.includes("bestseller"),
      new_arrival: input.badges.includes("new"),
      limited: input.badges.includes("limited"),
      sort_order: input.sortOrder ?? 0,
      product_stage_preset: input.stagePreset || null,
      stage_object_position: input.objectPosition || null,
      stage_mobile_object_position: input.mobileObjectPosition || null,
      made_to_order: input.kind !== "ready_stock",
      inventory_policy: input.inventoryPolicy ?? "deny",
      production_lead_time_min_days: input.productionLeadTimeMinDays,
      production_lead_time_max_days: input.productionLeadTimeMaxDays,
      material_summary: input.materialSummary || null,
      weight_grams: input.weightGrams,
      width_mm: input.widthMm,
      depth_mm: input.depthMm,
      height_mm: input.heightMm,
      personalization_enabled: input.personalizationEnabled ?? false,
      personalization_instructions: input.personalizationFields ?? [],
      canonical_url: input.canonicalUrl || null,
      search_visible: input.searchVisible ?? true,
      archived_at:
        input.status === "archived" ? new Date().toISOString() : null,
      updated_by: actorId,
      ...(created ? { created_by: actorId } : {}),
      cost_price_minor: input.costPriceMinor ?? null,
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
        inventory_policy: input.inventoryPolicy ?? "deny",
        material_code: input.materialCode || null,
        material_summary: input.materialSummary || null,
        weight_grams: input.weightGrams ?? null,
        width_mm: input.widthMm ?? null,
        depth_mm: input.depthMm ?? null,
        height_mm: input.heightMm ?? null,
        personalization_enabled: input.personalizationEnabled ?? false,
        personalization_fields: input.personalizationFields ?? [],
        sort_order: input.sortOrder ?? 0,
        canonical_url: input.canonicalUrl || null,
        search_visible: input.searchVisible ?? true,
        noindex: input.noindex ?? false,
        model_name: input.modelName || null,
        theme_style: input.themeStyle || null,
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
      material: variant.material || null,
      size_label: variant.sizeLabel || null,
      price_adjustment_minor: variant.priceAdjustmentMinor,
    },
    price_adjustment_minor: variant.priceAdjustmentMinor,
    color_name: variant.colorName || null,
    color_hex: variant.colorHex || null,
    size_label: variant.sizeLabel || null,
    material: variant.material || null,
    active: variant.isActive,
    sort_order: index,
    barcode: variant.barcode || (index === 0 && input.barcode ? input.barcode : null),
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

  const imageRows = input.media.map((media, index) => {
    const storagePath = media.storagePath || null;
    return {
      id: media.id ?? randomUUID(),
      product_id: productId,
      variant_id: media.variantId || null,
      storage_path: storagePath,
      external_url: storagePath ? null : media.url,
      alt_text: media.alt,
      position: index,
      is_primary: media.role === "cover" || media.role === "primary" || index === 0,
      is_public: true,
      media_type: media.role === "video" ? "video" : "image",
      mime_type: media.mimeType || null,
      role: media.role ?? null,
      object_position: media.objectPosition || null,
      mobile_object_position: media.mobileObjectPosition || null,
      sort_order: index,
    };
  });

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

  const auditAction = created
    ? "product_created"
    : input.status === "archived"
      ? "product_archived"
      : previousStatus !== "active" && input.status === "active"
        ? "product_published"
        : previousStatus === "active" && input.status !== "active"
          ? "product_unpublished"
          : "product_updated";
  await writeCatalogAudit(auditAction, productId, {
    status: input.status,
    slug: input.slug,
    price_minor: input.priceMinor,
  });

  if (
    !created &&
    previousPrice !== null &&
    Number(previousPrice) !== input.priceMinor
  ) {
    await writeCatalogAudit("price_changed", productId, {
      from_minor: previousPrice,
      to_minor: input.priceMinor,
    });
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
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", productId);
  assertDatabaseResult(productResult.error, "Ürün arşivlenemedi");

  const variantResult = await supabase
    .from("product_variants")
    .update({ status: "archived" })
    .eq("product_id", productId);
  assertDatabaseResult(variantResult.error, "Varyantlar arşivlenemedi");
  await writeCatalogAudit("product_archived", productId);
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  if (isDevelopmentDemoMode) {
    await removeDemoProduct(productId);
    await removeLocalCatalogMediaForProduct(productId);
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
    name: `${source.name} — Kopya`.slice(0, 180),
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
    imageUrl: input.imageUrl || existing?.imageUrl || `/demo/categories/${input.slug}.png`,
    eyebrow: input.eyebrow?.trim() || existing?.eyebrow || "Koleksiyon",
    imageFit: input.imageFit,
    imageScale: input.imageScale,
    objectPosition:
      input.objectPosition || existing?.objectPosition || "50% 50%",
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
    ...categoryPresentationFields(category),
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
      seo_title: input.eyebrow?.trim() || null,
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
    ...categoryPresentationFields({
      eyebrow: input.eyebrow,
      imageFit: input.imageFit,
      imageScale: input.imageScale,
      objectPosition: input.objectPosition,
    }),
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

export type BulkCatalogAction =
  | "publish"
  | "unpublish"
  | "archive"
  | "feature"
  | "unfeature"
  | "assign-category";

export async function bulkUpdateAdminProducts(input: {
  ids: string[];
  action: BulkCatalogAction;
  categorySlug?: string;
}): Promise<{ updated: number }> {
  const uniqueIds = [...new Set(input.ids)].slice(0, 100);
  if (!uniqueIds.length) {
    return { updated: 0 };
  }

  for (const id of uniqueIds) {
    const product = await getAdminProductById(id);
    if (!product) {
      continue;
    }

    if (input.action === "publish") {
      await saveAdminProduct({
        ...productToWritable(product),
        status: "active",
        publishedAt: product.publishedAt || new Date().toISOString(),
      });
    } else if (input.action === "unpublish") {
      await saveAdminProduct({
        ...productToWritable(product),
        status: "draft",
      });
    } else if (input.action === "archive") {
      await archiveAdminProduct(id);
    } else if (input.action === "feature") {
      await saveAdminProduct({ ...productToWritable(product), featured: true });
    } else if (input.action === "unfeature") {
      await saveAdminProduct({ ...productToWritable(product), featured: false });
    } else if (input.action === "assign-category" && input.categorySlug) {
      const slugs = product.categorySlugs.includes(input.categorySlug)
        ? product.categorySlugs
        : [...product.categorySlugs, input.categorySlug];
      await saveAdminProduct({
        ...productToWritable(product),
        categorySlugs: slugs,
      });
    }
  }

  return { updated: uniqueIds.length };
}

export async function importDemoCatalogProducts(): Promise<{
  importedCount: number;
  skippedCount: number;
}> {
  const { demoProducts } = await import("@/domain/catalog/demo-data");
  const { mergeDemoProductImport } = await import("@/domain/catalog/demo-import");

  if (isDevelopmentDemoMode) {
    const snapshot = await loadDemoCatalog();
    const merged = mergeDemoProductImport(snapshot.products, demoProducts);
    snapshot.products = merged.products;
    await saveDemoCatalog(snapshot);
    return {
      importedCount: merged.importedCount,
      skippedCount: merged.skippedCount,
    };
  }

  const existing = await listAdminProducts();
  const existingSlugs = new Set(existing.map((product) => product.slug));
  const { products, importedCount, skippedCount } = mergeDemoProductImport(
    existing,
    demoProducts,
  );
  let written = 0;
  for (const product of products) {
    if (!product.id.startsWith("imported-demo-") || existingSlugs.has(product.slug)) {
      continue;
    }
    await saveAdminProduct({
      ...productToWritable(product),
      id: undefined,
      sku: product.sku,
    });
    written += 1;
  }

  return {
    importedCount: written || importedCount,
    skippedCount,
  };
}

export async function importAdminProductsFromCsv(
  rows: Array<{
    name: string;
    slug: string;
    sku: string;
    barcode: string;
    category: string;
    description: string;
    priceMinor: number;
    vatRateBps: number;
    stock: number;
    material: string;
    color: string;
    status: string;
  }>,
): Promise<{ upserted: number; skipped: number }> {
  const existing = await listAdminProducts();
  const bySku = new Map(
    existing.map((product) => [product.sku.toLocaleLowerCase("tr-TR"), product]),
  );
  let upserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const status =
      row.status === "active" ||
      row.status === "draft" ||
      row.status === "archived" ||
      row.status === "scheduled"
        ? row.status
        : null;
    if (!status) {
      skipped += 1;
      continue;
    }

    const current = bySku.get(row.sku.toLocaleLowerCase("tr-TR"));
    const base = current
      ? productToWritable(current)
      : {
          ...productToWritable({
            id: crypto.randomUUID(),
            name: row.name,
            slug: row.slug,
            shortDescription: row.description.slice(0, 320) || `${row.name} ürünü.`,
            description:
              row.description.length >= 20
                ? row.description
                : `${row.description} Detaylı ürün açıklaması yönetim panelinden tamamlanmalıdır.`,
            status: "draft",
            kind: "made_to_order" as const,
            priceMinor: row.priceMinor,
            compareAtPriceMinor: null,
            currency: "TRY" as const,
            sku: row.sku,
            barcode: row.barcode,
            inventoryQuantity: row.stock,
            productionLeadTimeDays: { min: 2, max: 5 },
            categorySlugs: row.category ? [row.category] : [],
            collectionSlugs: [],
            media: [],
            variants: [
              {
                id: crypto.randomUUID(),
                name: row.color || "Standart",
                sku: row.sku,
                colorName: row.color || undefined,
                priceAdjustmentMinor: 0,
                inventoryQuantity: row.stock,
                isActive: true,
              },
            ],
            badges: [],
            featured: false,
            seoTitle: row.name,
            seoDescription: row.description.slice(0, 320),
            publishedAt: status === "active" ? new Date().toISOString() : null,
            isDemo: false,
          }),
          id: undefined,
        };

    await saveAdminProduct({
      ...base,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      barcode: row.barcode,
      description:
        row.description.length >= 20 ? row.description : base.description,
      shortDescription:
        row.description.slice(0, 320).length >= 10
          ? row.description.slice(0, 320)
          : base.shortDescription,
      priceMinor: row.priceMinor,
      vatRateBps: row.vatRateBps,
      status,
      publishedAt:
        status === "active"
          ? base.publishedAt || new Date().toISOString()
          : base.publishedAt ?? "",
      categorySlugs: row.category
        ? Array.from(new Set([...(base.categorySlugs ?? []), row.category]))
        : base.categorySlugs,
      materialCode:
        row.material === "PLA" ||
        row.material === "PETG" ||
        row.material === "TPU" ||
        row.material === "ASA" ||
        row.material === "ABS" ||
        row.material === "Resin" ||
        row.material === "Other"
          ? row.material
          : base.materialCode,
    });
    upserted += 1;
  }

  return { upserted, skipped };
}

function productToWritable(product: Product): ProductFormInput {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    status: product.status,
    kind: product.kind,
    priceMinor: product.priceMinor,
    compareAtPriceMinor: product.compareAtPriceMinor,
    sku: product.sku,
    barcode: product.barcode ?? "",
    productionLeadTimeMinDays: product.productionLeadTimeDays.min,
    productionLeadTimeMaxDays: product.productionLeadTimeDays.max,
    categorySlugs: product.categorySlugs,
    collectionSlugs: product.collectionSlugs,
    featured: product.featured,
    stagePreset: product.presentation?.stagePreset ?? "",
    objectPosition: product.presentation?.objectPosition ?? "",
    mobileObjectPosition: product.presentation?.mobileObjectPosition ?? "",
    isolated: product.presentation?.isolated ?? false,
    badges: product.badges,
    publishedAt: product.publishedAt ?? "",
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    media: product.media.map((media, index) => ({
      id: media.id,
      url: media.url,
      alt: media.alt,
      position: index,
      role: media.role,
      objectPosition: media.objectPosition ?? "",
      mobileObjectPosition: media.mobileObjectPosition ?? "",
      isolated: media.isolated,
      storagePath: media.storagePath ?? undefined,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode ?? "",
      colorName: variant.colorName ?? "",
      colorHex: variant.colorHex ?? "",
      material: variant.material ?? "",
      sizeLabel: variant.sizeLabel ?? "",
      priceAdjustmentMinor: variant.priceAdjustmentMinor,
      inventoryQuantity: variant.inventoryQuantity,
      isActive: variant.isActive,
    })),
  };
}
