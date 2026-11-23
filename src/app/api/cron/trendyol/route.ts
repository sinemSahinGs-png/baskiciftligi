import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import {
  CATALOG_CACHE_TAG,
  CATALOG_CATEGORIES_CACHE_TAG,
  CATALOG_FEATURED_CACHE_TAG,
} from "@/lib/catalog/cache-tags";
import { serverEnv } from "@/lib/env.server";
import { isTrendyolConfigured } from "@/providers/trendyol/client";
import { syncTrendyolCatalog } from "@/domain/catalog/trendyol-import";

export const runtime = "nodejs";
export const maxDuration = 10;

function authorized(request: Request): boolean {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isTrendyolConfigured()) {
    return NextResponse.json({ ok: true, skipped: "not_configured" });
  }

  const result = await syncTrendyolCatalog();
  revalidateTag(CATALOG_CACHE_TAG, "max");
  revalidateTag(CATALOG_FEATURED_CACHE_TAG, "max");
  revalidateTag(CATALOG_CATEGORIES_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/magaza", "layout");
  return NextResponse.json({ ok: true, result });
}
