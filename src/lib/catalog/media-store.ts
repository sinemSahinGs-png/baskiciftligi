import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { isDevelopmentDemoMode, isSupabaseConfigured } from "@/lib/env";
import {
  assertAllowedCatalogUpload,
  assertPngCategoryCover,
  safeCatalogFilename,
} from "@/lib/catalog/file-signature";
import {
  CATALOG_MEDIA_BUCKET,
  catalogMediaPublicUrl,
  catalogObjectPath,
  curatedMediaObjectPath,
} from "@/lib/catalog/media-url";
import { categoryCoverPublicPath } from "@/lib/catalog/category-cover";
import { assertCuratedCoverDimensions } from "@/lib/curated-models/image-dimensions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface StoredCatalogMedia {
  id: string;
  storagePath: string;
  url: string;
  mimeType: string;
  kind: "image" | "video";
  fileSize: number;
}

const localMediaRoot = path.join(process.cwd(), ".octo-data", "media");

export async function storeCatalogMediaFile(input: {
  productId?: string;
  curatedModelId?: string;
  bytes: Uint8Array;
  filename: string;
  declaredMime?: string | null;
}): Promise<StoredCatalogMedia> {
  const detected = assertAllowedCatalogUpload({
    bytes: input.bytes,
    filename: input.filename,
    declaredMime: input.declaredMime,
  });
  if (input.curatedModelId) {
    if (detected.kind !== "image") {
      throw new Error("Küratörlü modeller için yalnızca görsel yüklenebilir.");
    }
    assertCuratedCoverDimensions(input.bytes);
  }
  const mediaId = randomUUID();
  const filename = safeCatalogFilename(input.filename, detected.extension);
  const ownerId = input.curatedModelId ?? input.productId;
  if (!ownerId) {
    throw new Error("Medya sahibi kimliği gerekli.");
  }
  const objectPath = input.curatedModelId
    ? curatedMediaObjectPath(input.curatedModelId, mediaId, filename)
    : catalogObjectPath(input.productId!, mediaId, filename);

  if (isSupabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase depolama oturumu açılamadı.");
    }

    const upload = await supabase.storage
      .from(CATALOG_MEDIA_BUCKET)
      .upload(objectPath, input.bytes, {
        contentType: detected.mimeType,
        upsert: false,
        cacheControl: "public, max-age=31536000, immutable",
      });

    if (upload.error) {
      throw new Error(`Medya yüklenemedi: ${upload.error.message}`);
    }

    return {
      id: mediaId,
      storagePath: objectPath,
      url: catalogMediaPublicUrl(objectPath),
      mimeType: detected.mimeType,
      kind: detected.kind,
      fileSize: input.bytes.byteLength,
    };
  }

  if (!isDevelopmentDemoMode) {
    throw new Error(
      "Ürün görseli deposu yapılandırılmadı. Supabase Storage bağlanmadan üretimde yükleme yapılamaz.",
    );
  }

  const absolute = path.join(localMediaRoot, objectPath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, input.bytes);

  return {
    id: mediaId,
    storagePath: objectPath,
    url: `/catalog-media/${objectPath}`,
    mimeType: detected.mimeType,
    kind: detected.kind,
    fileSize: input.bytes.byteLength,
  };
}

export async function storeCategoryCoverPng(input: {
  slug: string;
  bytes: Uint8Array;
  filename: string;
  declaredMime?: string | null;
}): Promise<StoredCatalogMedia> {
  const detected = assertPngCategoryCover({
    bytes: input.bytes,
    filename: input.filename,
    declaredMime: input.declaredMime,
  });
  const objectPath = `categories/${input.slug}/cover.png`;

  if (isSupabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase depolama oturumu açılamadı.");
    }

    const upload = await supabase.storage
      .from(CATALOG_MEDIA_BUCKET)
      .upload(objectPath, input.bytes, {
        contentType: detected.mimeType,
        upsert: true,
        cacheControl: "public, max-age=31536000, immutable",
      });

    if (upload.error) {
      throw new Error(`Kategori görseli yüklenemedi: ${upload.error.message}`);
    }

    return {
      id: input.slug,
      storagePath: objectPath,
      url: catalogMediaPublicUrl(objectPath),
      mimeType: detected.mimeType,
      kind: "image",
      fileSize: input.bytes.byteLength,
    };
  }

  if (!isDevelopmentDemoMode) {
    throw new Error(
      "Kategori görseli deposu yapılandırılmadı. Supabase Storage bağlanmadan üretimde yükleme yapılamaz.",
    );
  }

  const publicPath = categoryCoverPublicPath(input.slug);
  const absolute = path.join(process.cwd(), "public", publicPath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, input.bytes);

  return {
    id: input.slug,
    storagePath: publicPath.replace(/^\//, ""),
    url: publicPath,
    mimeType: detected.mimeType,
    kind: "image",
    fileSize: input.bytes.byteLength,
  };
}

export async function removeLocalCatalogMediaForProduct(
  productId: string,
): Promise<void> {
  if (!/^[A-Za-z0-9_-]+$/.test(productId)) {
    return;
  }
  await rm(path.join(localMediaRoot, "products", productId), {
    recursive: true,
    force: true,
  });
}
