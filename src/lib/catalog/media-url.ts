import { publicEnv } from "@/lib/env";

export const CATALOG_MEDIA_BUCKET = "catalog-media";

export function catalogMediaPublicUrl(storagePath: string): string {
  const normalized = storagePath.replace(/^\/+/, "");

  if (normalized.startsWith("catalog-media/")) {
    return `/${normalized}`;
  }

  const supabaseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${CATALOG_MEDIA_BUCKET}/${normalized}`;
  }

  return `/catalog-media/${normalized}`;
}

export function catalogCardImageUrl(url: string, width = 640): string {
  const marker = "/storage/v1/object/public/catalog-media/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const origin = url.slice(0, index);
  const objectPath = url.slice(index + marker.length);
  return `${origin}/storage/v1/render/image/public/catalog-media/${objectPath}?width=${width}&resize=contain&quality=70`;
}

export function catalogObjectPath(productId: string, mediaId: string, filename: string): string {
  return `products/${productId}/${mediaId}-${filename}`;
}

export function curatedMediaObjectPath(
  curatedModelId: string,
  mediaId: string,
  filename: string,
): string {
  return `curated/${curatedModelId}/${mediaId}-${filename}`;
}
