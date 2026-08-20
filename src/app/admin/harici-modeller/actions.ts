"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deleteCuratedModel,
  saveCuratedModel,
} from "@/domain/curated-models/repository";
import {
  assertCuratedPublishReady,
  sanitizeSearchTerms,
  slugifyCuratedTitle,
  validateCuratedSourceUrl,
  type CuratedPlatform,
  type CuratedPublicationStatus,
} from "@/domain/curated-models/types";
import { peekOpenGraphMetadata } from "@/lib/curated-models/open-graph";
import {
  canPublishCatalog,
} from "@/lib/catalog/authorization";
import {
  requireCatalogPublisher,
  requireCatalogWriter,
} from "@/lib/auth/session";
import type { AdminActionState } from "@/app/admin/admin-state";

function revalidateCurated(paths: string[] = []) {
  revalidatePath("/hazir-modeller");
  revalidatePath("/");
  revalidatePath("/admin/harici-modeller");
  for (const path of paths) {
    revalidatePath(path);
  }
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parsePlatform(raw: string): CuratedPlatform {
  if (
    raw === "printables" ||
    raw === "thingiverse" ||
    raw === "myminifactory" ||
    raw === "other" ||
    raw === "studio"
  ) {
    return raw;
  }
  return "other";
}

function parseStatus(raw: string): CuratedPublicationStatus {
  if (raw === "published" || raw === "archived" || raw === "draft") {
    return raw;
  }
  return "draft";
}

export async function analyzeCuratedSourceAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireCatalogWriter();
  const platform = parsePlatform(readString(formData, "platformType"));
  const sourceUrl = readString(formData, "sourceUrl");
  const check = validateCuratedSourceUrl(sourceUrl, platform);
  if (!check.ok) {
    return { status: "error", message: check.error };
  }
  const preview = await peekOpenGraphMetadata({
    url: check.canonicalUrl,
    platform,
  });
  return {
    status: "success",
    message: preview.note,
    fieldErrors: {
      suggestedTitle: preview.title ? [preview.title] : undefined,
      suggestedDescription: preview.description ? [preview.description] : undefined,
      canonicalUrl: [check.canonicalUrl],
    },
  };
}

export async function saveCuratedModelAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const viewer = await requireCatalogWriter();
  const id = readString(formData, "id") || undefined;
  const titleTr = readString(formData, "titleTr");
  const originalTitle = readString(formData, "originalTitle") || null;
  const description = readString(formData, "description") || null;
  const searchTerms = sanitizeSearchTerms(readString(formData, "searchTerms"));
  const categoryId = readString(formData, "categoryId") || null;
  const categoryLabel = readString(formData, "categoryLabel") || null;
  const platformType = parsePlatform(readString(formData, "platformType"));
  const sourceUrl = readString(formData, "sourceUrl");
  const previewImageUrl = readString(formData, "previewImageUrl") || null;
  const imageAlt = readString(formData, "imageAlt") || null;
  const authorName = readString(formData, "authorName") || null;
  const licenseCode = readString(formData, "licenseCode") || null;
  const licenseVerified = formData.get("licenseVerified") === "on";
  const requestedStatus = parseStatus(readString(formData, "status"));
  const slugRaw = readString(formData, "slug");
  const slug = slugRaw || slugifyCuratedTitle(titleTr) || `model-${Date.now()}`;

  const status = requestedStatus;
  if (status === "published" && !canPublishCatalog(viewer.role)) {
    return {
      status: "error",
      message: "Yayınlamak için owner veya admin yetkisi gerekir. Taslak olarak kaydedin.",
    };
  }
  if (status === "published") {
    const missing = assertCuratedPublishReady({
      titleTr,
      slug,
      description,
      searchTerms,
      categoryId,
      categoryLabel,
      platformType,
      sourceUrl,
      previewImageUrl,
      imageAlt,
      authorName,
      licenseCode,
      licenseVerified,
      status,
    });
    if (missing.length > 0) {
      return {
        status: "error",
        message: `Yayın için eksik: ${missing.join(", ")}`,
      };
    }
  }

  try {
    const savedId = await saveCuratedModel({
      id,
      titleTr,
      originalTitle,
      slug,
      description,
      searchTerms,
      categoryId,
      categoryLabel,
      platformType,
      listingKind: platformType === "studio" ? "studio" : "curated_external",
      sourceUrl,
      previewImageUrl,
      imageAlt,
      authorName,
      licenseCode,
      licenseVerified,
      status,
      createdBy: viewer.id,
    });
    revalidateCurated([
      `/admin/harici-modeller/${savedId}`,
      `/hazir-modeller/katalog/${slug}`,
    ]);
    redirect(`/admin/harici-modeller/${savedId}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Kayıt başarısız.",
    };
  }
}

export async function deleteCuratedModelAction(formData: FormData) {
  await requireCatalogPublisher();
  const id = readString(formData, "id");
  if (!id) {
    throw new Error("Model kimliği gerekli.");
  }
  await deleteCuratedModel(id);
  revalidateCurated();
  redirect("/admin/harici-modeller");
}
