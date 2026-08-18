"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import {
  archiveAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  duplicateAdminProduct,
  saveAdminCategory,
  saveAdminProduct,
} from "@/domain/catalog/admin-repository";
import { requireAdmin } from "@/lib/auth/session";
import {
  catalogRecordIdSchema,
  categoryFormSchema,
  productFormSchema,
  type CategoryFormInput,
  type ProductFormInput,
} from "@/lib/validation/catalog";
import type { AdminActionState } from "./admin-state";

function revalidateCatalog(productId?: string) {
  revalidateTag("catalog", "max");
  revalidatePath("/");
  revalidatePath("/magaza", "layout");
  revalidatePath("/urun", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/kategoriler");

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
    message.includes("Yerel demo mutasyonları kapalı")
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
  await requireAdmin();

  const parsed = productFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Ürün bilgilerini kontrol edin.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
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
  await requireAdmin();

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
  await requireAdmin();

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
  await requireAdmin();

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
  await requireAdmin();

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
  await requireAdmin();

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
