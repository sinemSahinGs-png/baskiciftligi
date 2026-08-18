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

export function catalogObjectPath(productId: string, mediaId: string, filename: string): string {
  return `products/${productId}/${mediaId}-${filename}`;
}
