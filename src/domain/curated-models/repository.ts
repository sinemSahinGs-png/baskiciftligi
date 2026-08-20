import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { matchesTurkish } from "@/lib/search/turkish-match";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  assertCuratedPublishReady,
  sanitizeSearchTerms,
  validateCuratedSourceUrl,
  type CuratedListingKind,
  type CuratedModelInput,
  type CuratedModelRecord,
  type CuratedPlatform,
} from "@/domain/curated-models/types";

const SOURCE_SLUG = "baski-ciftligi";

const SELECT_COLS =
  "id, external_id, slug, title, title_tr, original_title, description, search_terms, category_id, platform_type, listing_kind, source_url, preview_image_url, image_alt, download_url, author_name, author_url, license_code, license_verified, attribution_text, status, metadata, published_at, created_by, updated_at, categories:category_id(name)";

function mapRow(row: Record<string, unknown>): CuratedModelRecord {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  const categoryJoin = row.categories as { name?: string } | null;
  const titleTr = String(row.title_tr ?? row.title ?? "");
  return {
    id: String(row.id),
    sourceSlug: SOURCE_SLUG,
    externalId: String(row.external_id),
    slug: String(row.slug),
    title: titleTr,
    titleTr,
    originalTitle: row.original_title ? String(row.original_title) : null,
    description: row.description ? String(row.description) : null,
    searchTerms: Array.isArray(row.search_terms)
      ? row.search_terms.map(String)
      : [],
    categoryId: row.category_id ? String(row.category_id) : null,
    categoryLabel:
      categoryJoin?.name ??
      (typeof metadata.categoryLabel === "string" ? metadata.categoryLabel : null),
    platformType: (row.platform_type as CuratedPlatform) ?? "other",
    listingKind: (row.listing_kind as CuratedListingKind) ?? "curated_external",
    sourceUrl: String(row.source_url),
    previewImageUrl: row.preview_image_url ? String(row.preview_image_url) : null,
    imageAlt: row.image_alt ? String(row.image_alt) : null,
    downloadUrl: row.download_url ? String(row.download_url) : null,
    authorName: row.author_name ? String(row.author_name) : null,
    authorUrl: row.author_url ? String(row.author_url) : null,
    licenseCode: row.license_code ? String(row.license_code) : null,
    licenseVerified: Boolean(row.license_verified),
    attributionText: row.attribution_text ? String(row.attribution_text) : null,
    status: row.status as CuratedModelRecord["status"],
    permissionKind:
      (metadata.permissionKind as CuratedModelRecord["permissionKind"]) ??
      (row.listing_kind === "studio" ? "owned" : "licensed"),
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    updatedAt: String(row.updated_at),
  };
}

async function curatedSourceId(
  client: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
) {
  const { data } = await client
    .from("external_model_sources")
    .select("id")
    .eq("slug", SOURCE_SLUG)
    .maybeSingle();
  return data?.id ?? null;
}

function matchesCuratedQuery(model: CuratedModelRecord, query: string) {
  return matchesTurkish(
    `${model.titleTr} ${model.originalTitle ?? ""} ${model.description ?? ""} ${model.categoryLabel ?? ""} ${model.searchTerms.join(" ")} ${model.authorName ?? ""}`,
    query,
  );
}

export async function listPublishedCuratedModels(
  limit = 12,
  listingKind?: CuratedListingKind,
): Promise<CuratedModelRecord[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  const client = await createServerSupabaseClient();
  if (!client) {
    return [];
  }
  const sourceId = await curatedSourceId(client);
  if (!sourceId) {
    return [];
  }
  let request = client
    .from("external_models")
    .select(SELECT_COLS)
    .eq("source_id", sourceId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (listingKind) {
    request = request.eq("listing_kind", listingKind);
  }
  const { data, error } = await request;
  if (error || !data) {
    return [];
  }
  return data.map((row) => mapRow(row as Record<string, unknown>));
}

export async function searchPublishedCuratedModels(
  query: string,
  limit = 24,
  listingKind?: CuratedListingKind,
): Promise<CuratedModelRecord[]> {
  const models = await listPublishedCuratedModels(96, listingKind);
  if (!query.trim()) {
    return models.slice(0, limit);
  }
  return models.filter((model) => matchesCuratedQuery(model, query)).slice(0, limit);
}

export async function getPublishedCuratedModel(
  externalId: string,
): Promise<CuratedModelRecord | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const client = await createServerSupabaseClient();
  if (!client) {
    return null;
  }
  const sourceId = await curatedSourceId(client);
  if (!sourceId) {
    return null;
  }
  const { data, error } = await client
    .from("external_models")
    .select(SELECT_COLS)
    .eq("source_id", sourceId)
    .eq("status", "published")
    .or(`external_id.eq.${externalId},slug.eq.${externalId}`)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return mapRow(data as Record<string, unknown>);
}

export async function listCuratedModelsForAdmin(): Promise<CuratedModelRecord[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  const { assertServiceRoleClient } = await import("@/lib/supabase/admin");
  const client = assertServiceRoleClient();
  const { data: source } = await client
    .from("external_model_sources")
    .select("id")
    .eq("slug", SOURCE_SLUG)
    .maybeSingle();
  if (!source?.id) {
    return [];
  }
  const { data, error } = await client
    .from("external_models")
    .select(SELECT_COLS)
    .eq("source_id", source.id)
    .order("updated_at", { ascending: false });
  if (error || !data) {
    return [];
  }
  return data.map((row) => mapRow(row as Record<string, unknown>));
}

export async function getCuratedModelForAdmin(
  id: string,
): Promise<CuratedModelRecord | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const { assertServiceRoleClient } = await import("@/lib/supabase/admin");
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("external_models")
    .select(SELECT_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return mapRow(data as Record<string, unknown>);
}

async function sourceIdForCurated() {
  const { assertServiceRoleClient } = await import("@/lib/supabase/admin");
  const client = assertServiceRoleClient();
  const { data } = await client
    .from("external_model_sources")
    .select("id")
    .eq("slug", SOURCE_SLUG)
    .maybeSingle();
  return data?.id ?? null;
}

export async function saveCuratedModel(input: CuratedModelInput) {
  const listingKind = input.listingKind ?? "curated_external";
  const status = input.status ?? "draft";
  if (status === "published") {
    const missing = assertCuratedPublishReady(input);
    if (missing.length > 0) {
      throw new Error(`Yayın için eksik: ${missing.join(", ")}`);
    }
  }

  const urlCheck = validateCuratedSourceUrl(input.sourceUrl, input.platformType);
  if (!urlCheck.ok) {
    throw new Error(urlCheck.error);
  }

  const { assertServiceRoleClient } = await import("@/lib/supabase/admin");
  const client = assertServiceRoleClient();
  const sourceId = await sourceIdForCurated();
  if (!sourceId) {
    throw new Error("Kürasyon kaynağı yapılandırılmadı.");
  }

  const existing = input.id
    ? await client
        .from("external_models")
        .select("published_at, status")
        .eq("id", input.id)
        .maybeSingle()
    : { data: null };

  const wasPublished = existing.data?.status === "published";
  const publishedAt =
    status === "published"
      ? wasPublished && existing.data?.published_at
        ? String(existing.data.published_at)
        : new Date().toISOString()
      : null;

  const payload = {
    source_id: sourceId,
    external_id: input.slug,
    slug: input.slug,
    title: input.titleTr.trim(),
    title_tr: input.titleTr.trim(),
    original_title: input.originalTitle?.trim() || null,
    description: input.description?.trim() || null,
    search_terms: sanitizeSearchTerms(input.searchTerms),
    category_id: input.categoryId || null,
    platform_type: input.platformType,
    listing_kind: listingKind,
    source_url: urlCheck.canonicalUrl,
    preview_image_url: input.previewImageUrl ?? null,
    image_alt: input.imageAlt?.trim() || null,
    download_url: input.downloadUrl ?? null,
    author_name: input.authorName?.trim() || null,
    license_code: input.licenseCode?.trim() || null,
    license_verified: Boolean(input.licenseVerified),
    attribution_text: input.attributionText?.trim() || null,
    status,
    published_at: publishedAt,
    metadata: {
      categoryLabel: input.categoryLabel ?? null,
      permissionKind:
        input.permissionKind ??
        (listingKind === "studio" ? "owned" : "licensed"),
    },
    updated_at: new Date().toISOString(),
  };

  if (input.id && existing.data) {
    const { data, error } = await client
      .from("external_models")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data.id as string;
  }

  const { data, error } = await client
    .from("external_models")
    .insert({
      ...payload,
      ...(input.id ? { id: input.id } : {}),
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data.id as string;
}

export async function deleteCuratedModel(id: string) {
  const { assertServiceRoleClient } = await import("@/lib/supabase/admin");
  const client = assertServiceRoleClient();
  const { error } = await client.from("external_models").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
