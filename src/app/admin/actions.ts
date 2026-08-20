"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import {
  archiveAdminProduct,
  bulkUpdateAdminProducts,
  deleteAdminCategory,
  deleteAdminProduct,
  duplicateAdminProduct,
  getAdminProductById,
  importDemoCatalogProducts,
  saveAdminCategory,
  saveAdminProduct,
  type BulkCatalogAction,
} from "@/domain/catalog/admin-repository";
import {
  requireCatalogOwner,
  requireCatalogPublisher,
  requireCatalogWriter,
} from "@/lib/auth/session";
import {
  CATALOG_CACHE_TAG,
  CATALOG_CATEGORIES_CACHE_TAG,
  CATALOG_FEATURED_CACHE_TAG,
  categoryCacheTag,
  productCacheTag,
} from "@/lib/catalog/cache-tags";
import {
  assessPublicationReadiness,
  publicationSaveMessage,
} from "@/lib/catalog/publication-checklist";
import { prepareProductForSave, type VariantMode } from "@/lib/catalog/prepare-product-save";
import {
  buildSuggestedSku,
  categoryCodeFromSlug,
  parseSkuSequence,
} from "@/lib/catalog/sku-generator";
import { canonicalCategorySlugs } from "@/lib/catalog/canonical-categories";
import { allowDemoCatalogImport } from "@/lib/catalog/source";
import { syncCanonicalCategories } from "@/lib/catalog/sync-categories";
import { applyPublicationInput } from "@/lib/catalog/publication";
import { isSupabaseConfigured, allowProductionDemoImport } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { minorUnitsFromClientNumber } from "@/lib/catalog/money-input";
import { saveSiteContent } from "@/domain/site/content-repository";
import { mergeSiteContent } from "@/domain/site/content";
import {
  catalogRecordIdSchema,
  categoryFormSchema,
  productFormSchema,
  type CategoryFormInput,
  type ProductFormInput,
} from "@/lib/validation/catalog";
import { siteContentFormSchema } from "@/lib/validation/site-content";
import type { AdminActionState } from "./admin-state";

function revalidateCatalog(product?: {
  id: string;
  slug: string;
  categorySlugs: string[];
  featured?: boolean;
}) {
  revalidateTag(CATALOG_CACHE_TAG, "max");
  revalidateTag(CATALOG_FEATURED_CACHE_TAG, "max");
  revalidateTag(CATALOG_CATEGORIES_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/magaza", "layout");
  revalidatePath("/urun", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/kategoriler");
  revalidatePath("/admin/icerik");

  for (const categorySlug of canonicalCategorySlugs()) {
    revalidateTag(categoryCacheTag(categorySlug), "max");
    revalidatePath(`/magaza/${categorySlug}`);
  }

  if (product) {
    revalidateTag(productCacheTag(product.slug), "max");
    for (const categorySlug of product.categorySlugs) {
      revalidateTag(categoryCacheTag(categorySlug), "max");
      revalidatePath(`/magaza/${categorySlug}`);
    }
    if (product.featured) {
      revalidatePath("/");
    }
    revalidatePath(`/urun/${product.slug}`);
    revalidatePath(`/admin/urunler/${product.id}`);
    revalidatePath(`/admin/urunler/${product.id}/onizleme`);
  }
}

function expectedErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";

  console.error("[Octo Studio admin]", error);

  if (
    message.includes("başka bir demo") ||
    message.includes("Ürün atanmış") ||
    message.includes("bulunamadı") ||
    message.includes("Yerel demo mutasyonları kapalı") ||
    message.includes("Vitrin metinleri henüz")
  ) {
    return message;
  }

  if (
    message.toLocaleLowerCase("tr-TR").includes("duplicate key") ||
    message.toLocaleLowerCase("tr-TR").includes("unique constraint")
  ) {
    return "Slug, SKU veya barkod değeri başka bir kayıtta kullanılıyor.";
  }

  if (
    message.toLocaleLowerCase("tr-TR").includes("row-level security") ||
    message.toLocaleLowerCase("tr-TR").includes("permission denied")
  ) {
    return "Bu işlem için veritabanı yönetici yetkisi doğrulanamadı.";
  }

  return fallback;
}

export async function suggestProductSkuAction(input: {
  categorySlugs: string[];
  excludeProductId?: string;
}): Promise<{ sku: string | null }> {
  await requireCatalogWriter();

  const prefix = categoryCodeFromSlug(input.categorySlugs[0] ?? "genel");
  if (!isSupabaseConfigured) {
    return { sku: buildSuggestedSku(input.categorySlugs, 1) };
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return { sku: buildSuggestedSku(input.categorySlugs, 1) };
  }

  const { data, error } = await supabase.from("products").select("id, metadata").limit(500);

  if (error) {
    return { sku: buildSuggestedSku(input.categorySlugs, 1) };
  }

  let maxSequence = 0;
  for (const row of data ?? []) {
    if (input.excludeProductId && row.id === input.excludeProductId) {
      continue;
    }
    const metadata =
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};
    const sku = typeof metadata.sku === "string" ? metadata.sku : "";
    const sequence = parseSkuSequence(sku, prefix);
    if (sequence !== null) {
      maxSequence = Math.max(maxSequence, sequence);
    }
  }

  return { sku: buildSuggestedSku(input.categorySlugs, maxSequence + 1) };
}

export async function saveProductAction(
  input: ProductFormInput,
  options: {
    intent?: "draft" | "publish";
    variantMode?: VariantMode;
  } = {},
): Promise<AdminActionState> {
  const intent = options.intent ?? "draft";
  const publishing = intent === "publish";
  const normalizedInput = prepareProductForSave(input, {
    variantMode: options.variantMode,
    publishing,
    draft: !publishing,
  });

  if (publishing) {
    await requireCatalogPublisher();
  } else {
    await requireCatalogWriter();
  }

  try {
    const prepared = applyPublicationInput(
      publishing
        ? { ...normalizedInput, status: "active" as const }
        : { ...normalizedInput, status: "draft" as const },
    );
    const parsed = productFormSchema.safeParse({
      ...prepared,
      priceMinor:
        prepared.priceMinor === null || prepared.priceMinor === undefined
          ? 0
          : minorUnitsFromClientNumber(prepared.priceMinor),
      compareAtPriceMinor:
        input.compareAtPriceMinor === null ||
        input.compareAtPriceMinor === undefined ||
        input.compareAtPriceMinor === 0
          ? null
          : minorUnitsFromClientNumber(input.compareAtPriceMinor),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: "Ürün bilgilerini kontrol edin.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    if (publishing) {
      const readiness = assessPublicationReadiness(parsed.data);
      if (!readiness.ready) {
        return {
          status: "error",
          message: `Yayın öncesi eksikler var: ${readiness.blockingMessages.join(" · ")}`,
          fieldErrors: {
            status: readiness.blockingMessages,
          },
        };
      }
    }

    const product = await saveAdminProduct(parsed.data);
    revalidateCatalog({
      id: product.id,
      slug: product.slug,
      categorySlugs: product.categorySlugs,
      featured: product.featured,
    });
    return {
      status: "success",
      message: publicationSaveMessage(product.status),
      id: product.id,
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, publishing ? "Yayın başarısız." : "Ürün kaydedilemedi."),
    };
  }
}

export async function duplicateProductAction(
  productId: string,
): Promise<AdminActionState> {
  await requireCatalogWriter();

  const parsedId = catalogRecordIdSchema.safeParse(productId);
  if (!parsedId.success) {
    return { status: "error", message: "Geçersiz ürün kimliği." };
  }

  try {
    const duplicate = await duplicateAdminProduct(parsedId.data);
    revalidateCatalog({
      id: duplicate.id,
      slug: duplicate.slug,
      categorySlugs: duplicate.categorySlugs,
      featured: duplicate.featured,
    });
    return {
      status: "success",
      message: "Taslak ürün kopyası oluşturuldu.",
      id: duplicate.id,
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Ürün çoğaltılamadı."),
    };
  }
}

export async function archiveProductAction(
  productId: string,
): Promise<AdminActionState> {
  await requireCatalogWriter();

  const parsedId = catalogRecordIdSchema.safeParse(productId);
  if (!parsedId.success) {
    return { status: "error", message: "Geçersiz ürün kimliği." };
  }

  try {
    const existing = await getAdminProductById(parsedId.data);
    await archiveAdminProduct(parsedId.data);
    if (existing) {
      revalidateCatalog({
        id: existing.id,
        slug: existing.slug,
        categorySlugs: existing.categorySlugs,
        featured: existing.featured,
      });
    } else {
      revalidateCatalog();
    }
    return { status: "success", message: publicationSaveMessage("archived") };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Ürün arşivlenemedi."),
    };
  }
}

export async function deleteProductAction(
  productId: string,
): Promise<AdminActionState> {
  await requireCatalogWriter();

  const parsedId = catalogRecordIdSchema.safeParse(productId);
  if (!parsedId.success) {
    return { status: "error", message: "Geçersiz ürün kimliği." };
  }

  try {
    const existing = await getAdminProductById(parsedId.data);
    await deleteAdminProduct(parsedId.data);
    if (existing) {
      revalidateCatalog({
        id: existing.id,
        slug: existing.slug,
        categorySlugs: existing.categorySlugs,
        featured: existing.featured,
      });
    } else {
      revalidateCatalog();
    }
    return { status: "success", message: "Ürün kalıcı olarak silindi." };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Ürün silinemedi."),
    };
  }
}

export async function saveCategoryAction(
  input: CategoryFormInput,
): Promise<AdminActionState> {
  await requireCatalogWriter();

  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Kategori bilgilerini kontrol edin.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const category = await saveAdminCategory(parsed.data);
    revalidateCatalog();
    return {
      status: "success",
      message: "Kategori kaydedildi.",
      id: category.id,
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Kategori kaydedilemedi."),
    };
  }
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<AdminActionState> {
  await requireCatalogWriter();

  const parsedId = catalogRecordIdSchema.safeParse(categoryId);
  if (!parsedId.success) {
    return { status: "error", message: "Geçersiz kategori kimliği." };
  }

  try {
    await deleteAdminCategory(parsedId.data);
    revalidateCatalog();
    return { status: "success", message: "Kategori silindi." };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Kategori silinemedi."),
    };
  }
}

export async function saveSiteContentAction(
  input: unknown,
): Promise<AdminActionState> {
  await requireCatalogWriter();

  const parsed = siteContentFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Vitrin metinlerini kontrol edin.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >,
    };
  }

  try {
    await saveSiteContent(mergeSiteContent(parsed.data));
    revalidateCatalog();
    return { status: "success", message: "Vitrin metinleri kaydedildi." };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Vitrin metinleri kaydedilemedi."),
    };
  }
}

export async function bulkProductsAction(input: {
  ids: string[];
  action: BulkCatalogAction;
  categorySlug?: string;
}): Promise<AdminActionState> {
  if (input.action === "publish" || input.action === "unpublish") {
    await requireCatalogPublisher();
  } else {
    await requireCatalogWriter();
  }

  const ids = input.ids
    .map((id) => catalogRecordIdSchema.safeParse(id))
    .flatMap((parsed) => (parsed.success ? [parsed.data] : []));

  if (!ids.length) {
    return { status: "error", message: "Seçili ürün yok." };
  }

  try {
    const result = await bulkUpdateAdminProducts({
      ids,
      action: input.action,
      categorySlug: input.categorySlug,
    });
    revalidateCatalog();
    return {
      status: "success",
      message: `${result.updated} ürün güncellendi.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Toplu işlem uygulanamadı."),
    };
  }
}

export async function importCatalogCsvAction(
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
): Promise<AdminActionState> {
  await requireCatalogWriter();

  if (!rows.length) {
    return { status: "error", message: "İçe aktarılacak satır yok." };
  }

  try {
    const { importAdminProductsFromCsv } = await import(
      "@/domain/catalog/admin-repository"
    );
    const result = await importAdminProductsFromCsv(rows);
    revalidateCatalog();
    return {
      status: "success",
      message: `${result.upserted} SKU işlendi, ${result.skipped} satır atlandı.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "CSV içe aktarılamadı."),
    };
  }
}

export async function previewSyncCanonicalCategoriesAction(): Promise<{
  status: "success" | "error";
  message?: string;
  created?: number;
  updated?: number;
  skipped?: number;
  decisions?: Array<{
    slug: string;
    operation: string;
    imageUrl: string;
  }>;
}> {
  await requireCatalogOwner();

  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: "Supabase yapılandırılmadı.",
    };
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    if (!supabase) {
      return {
        status: "error",
        message: "Service-role istemcisi yapılandırılmadı.",
      };
    }

    const viewer = await requireCatalogOwner();
    const result = await syncCanonicalCategories({
      supabase,
      dryRun: true,
      actorId: viewer.id,
      actorRole: viewer.role,
    });

    return {
      status: "success",
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      decisions: result.decisions.map((decision) => ({
        slug: decision.slug,
        operation: decision.operation,
        imageUrl: decision.imageUrl,
      })),
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(
        error,
        "Kategori senkronizasyonu önizlemesi başarısız.",
      ),
    };
  }
}

export async function syncCanonicalCategoriesAction(input: {
  confirmed: boolean;
}): Promise<AdminActionState & {
  created?: number;
  updated?: number;
  skipped?: number;
}> {
  await requireCatalogOwner();

  if (!input.confirmed) {
    return {
      status: "error",
      message: "Senkronizasyon için onay gerekir.",
    };
  }

  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: "Supabase yapılandırılmadı.",
    };
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    if (!supabase) {
      return {
        status: "error",
        message: "Service-role istemcisi yapılandırılmadı.",
      };
    }

    const viewer = await requireCatalogOwner();
    const result = await syncCanonicalCategories({
      supabase,
      dryRun: false,
      actorId: viewer.id,
      actorRole: viewer.role,
    });

    revalidateCatalog();

    return {
      status: "success",
      message: `${result.created} kategori oluşturuldu, ${result.updated} güncellendi, ${result.skipped} atlandı.`,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(
        error,
        "Kategori senkronizasyonu başarısız.",
      ),
    };
  }
}

export async function importDemoProductsAction(
  confirmed: boolean,
): Promise<AdminActionState> {
  await requireCatalogPublisher();

  if (!confirmed) {
    return { status: "error", message: "İçe aktarma onayı gereklidir." };
  }

  const allowed = allowDemoCatalogImport({
    nodeEnv: process.env.NODE_ENV,
    allowProductionImport: allowProductionDemoImport,
  });

  if (!allowed) {
    return {
      status: "error",
      message:
        "Demo ürün içe aktarma üretimde kapalıdır. ALLOW_PRODUCTION_DEMO_IMPORT=true ile bilinçli olarak açılabilir.",
    };
  }

  try {
    const result = await importDemoCatalogProducts();
    revalidateCatalog();
    return {
      status: "success",
      message: `${result.importedCount} demo ürün içe aktarıldı, ${result.skippedCount} kayıt atlandı.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Demo ürünler içe aktarılamadı."),
    };
  }
}
