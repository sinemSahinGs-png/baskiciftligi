"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import {
  archiveAdminProduct,
  bulkUpdateAdminProducts,
  deleteAdminCategory,
  deleteAdminProduct,
  duplicateAdminProduct,
  importDemoCatalogProducts,
  saveAdminCategory,
  saveAdminProduct,
  type BulkCatalogAction,
} from "@/domain/catalog/admin-repository";
import { requireCatalogPublisher, requireCatalogWriter } from "@/lib/auth/session";
import { allowDemoCatalogImport } from "@/lib/catalog/source";
import { allowProductionDemoImport } from "@/lib/env";
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

function revalidateCatalog(productId?: string) {
  revalidateTag("catalog", "max");
  revalidatePath("/");
  revalidatePath("/magaza", "layout");
  revalidatePath("/urun", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/kategoriler");
  revalidatePath("/admin/icerik");

  if (productId) {
    revalidatePath(`/admin/urunler/${productId}`);
    revalidatePath(`/admin/urunler/${productId}/onizleme`);
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

export async function saveProductAction(
  input: ProductFormInput,
): Promise<AdminActionState> {
  const publishes =
    input.status === "active" || input.status === "scheduled";
  if (publishes) {
    await requireCatalogPublisher();
  } else {
    await requireCatalogWriter();
  }

  try {
    const parsed = productFormSchema.safeParse({
      ...input,
      priceMinor: minorUnitsFromClientNumber(input.priceMinor),
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

    const product = await saveAdminProduct(parsed.data);
    revalidateCatalog(product.id);
    return {
      status: "success",
      message: "Ürün ve bağlı katalog kayıtları kaydedildi.",
      id: product.id,
    };
  } catch (error) {
    return {
      status: "error",
      message: expectedErrorMessage(error, "Ürün kaydedilemedi."),
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
    revalidateCatalog(duplicate.id);
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
    await archiveAdminProduct(parsedId.data);
    revalidateCatalog(parsedId.data);
    return { status: "success", message: "Ürün arşivlendi." };
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
    await deleteAdminProduct(parsedId.data);
    revalidateCatalog();
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
