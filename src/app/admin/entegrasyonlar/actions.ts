"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import type { AdminActionState } from "@/app/admin/admin-state";
import { requireCatalogWriter } from "@/lib/auth/session";
import {
  CATALOG_CACHE_TAG,
  CATALOG_CATEGORIES_CACHE_TAG,
  CATALOG_FEATURED_CACHE_TAG,
} from "@/lib/catalog/cache-tags";
import { isTrendyolConfigured } from "@/providers/trendyol/client";
import { syncTrendyolCatalog } from "@/domain/catalog/trendyol-import";

export async function syncTrendyolAction(
  _previous: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  await requireCatalogWriter();
  if (!isTrendyolConfigured()) {
    return {
      status: "error",
      message:
        "Trendyol bağlı değil. Vercel Production’a TRENDYOL_SELLER_ID, TRENDYOL_API_KEY ve TRENDYOL_API_SECRET ekleyip redeploy edin.",
    };
  }

  try {
    const page = Number(_formData.get("page") ?? 0);
    const result = await syncTrendyolCatalog({
      page: Number.isFinite(page) && page > 0 ? Math.trunc(page) : 0,
    });
    revalidateTag(CATALOG_CACHE_TAG, "max");
    revalidateTag(CATALOG_FEATURED_CACHE_TAG, "max");
    revalidateTag(CATALOG_CATEGORIES_CACHE_TAG, "max");
    revalidatePath("/");
    revalidatePath("/magaza", "layout");
    revalidatePath("/admin/urunler");
    revalidatePath("/admin/entegrasyonlar");
    revalidatePath("/admin/trendyol");
    const failNote = result.failed
      ? ` ${result.failed} kayıt atlandı.`
      : "";
    const moreNote = result.hasMore
      ? " Devam için tekrar Ürünleri çek."
      : "";
    const errorHint = result.errors[0] ? ` ${result.errors[0]}` : "";
    return {
      status: "success",
      message: `Trendyol: ${result.fetched}/${result.total || result.fetched} okundu, ${result.created} yeni, ${result.updated} güncellendi.${failNote}${moreNote}${errorHint}`,
      nextPage: result.hasMore ? result.page + 1 : 0,
      hasMore: result.hasMore,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Trendyol senkronu başarısız.",
    };
  }
}
