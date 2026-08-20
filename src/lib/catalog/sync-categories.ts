import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  canonicalCategorySlugs,
  listCanonicalCategories,
  type CanonicalCategoryDefinition,
} from "@/lib/catalog/canonical-categories";

export interface HostedCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  seo_title: string | null;
  status: string;
  position: number;
  stage_preset: string | null;
  active: boolean | null;
  published_at: string | null;
  sort_order: number | null;
}

export type CategorySyncOperation = "create" | "update" | "skip";

export interface CategorySyncDecision {
  slug: string;
  operation: CategorySyncOperation;
  id: string;
  imageUrl: string;
  changes: string[];
}

export interface CategorySyncPlan {
  dryRun: boolean;
  created: number;
  updated: number;
  skipped: number;
  decisions: CategorySyncDecision[];
  extraHosted: Array<{ id: string; slug: string; name: string }>;
}

export interface CategorySyncResult extends CategorySyncPlan {
  applied: boolean;
  auditLogId: number | null;
}

interface CategoryUpsertRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  seo_title: string;
  stage_preset: string;
  position: number;
  sort_order: number;
  status: "published";
  active: boolean;
  published_at: string;
}

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function resolveHostedImageUrl(
  slug: string,
  hosted: HostedCategoryRow | undefined,
  canonical: CanonicalCategoryDefinition,
): string {
  const stored = hosted?.image_url?.trim() ?? "";
  if (stored && !stored.endsWith(".svg")) {
    return stored;
  }
  return canonical.imageUrl;
}

export function buildCategoryUpsertRow(
  canonical: CanonicalCategoryDefinition,
  hosted?: HostedCategoryRow,
): { row: CategoryUpsertRow; changes: string[] } {
  const changes: string[] = [];
  const imageUrl = resolveHostedImageUrl(canonical.slug, hosted, canonical);

  const row: CategoryUpsertRow = {
    id: hosted?.id ?? randomUUID(),
    slug: canonical.slug,
    name: hasText(hosted?.name) ? hosted.name.trim() : canonical.name,
    description: hasText(hosted?.description)
      ? hosted.description.trim()
      : canonical.description,
    image_url: imageUrl,
    seo_title: hasText(hosted?.seo_title)
      ? hosted.seo_title.trim()
      : canonical.eyebrow,
    stage_preset: hasText(hosted?.stage_preset)
      ? hosted.stage_preset.trim()
      : canonical.stagePreset,
    position: canonical.position,
    sort_order: canonical.position,
    status: "published",
    active: true,
    published_at: hosted?.published_at ?? new Date().toISOString(),
  };

  if (!hosted) {
    changes.push("create");
    return { row, changes };
  }

  if (hosted.name?.trim() !== row.name) {
    changes.push("name");
  }
  if ((hosted.description ?? "").trim() !== row.description) {
    changes.push("description");
  }
  if ((hosted.image_url ?? "").trim() !== row.image_url) {
    changes.push("image_url");
  }
  if ((hosted.seo_title ?? "").trim() !== row.seo_title) {
    changes.push("seo_title");
  }
  if ((hosted.stage_preset ?? "").trim() !== row.stage_preset) {
    changes.push("stage_preset");
  }
  if (hosted.position !== row.position) {
    changes.push("position");
  }
  if ((hosted.sort_order ?? hosted.position) !== row.sort_order) {
    changes.push("sort_order");
  }
  if (hosted.status !== "published") {
    changes.push("status");
  }
  if (hosted.active !== true) {
    changes.push("active");
  }
  if (!hosted.published_at) {
    changes.push("published_at");
  }

  return { row, changes };
}

export function planCategorySync(input: {
  hosted: HostedCategoryRow[];
  dryRun: boolean;
}): CategorySyncPlan {
  const canonical = listCanonicalCategories();
  const hostedBySlug = new Map(input.hosted.map((row) => [row.slug, row]));
  const canonicalSlugSet = new Set(canonicalCategorySlugs());

  const decisions: CategorySyncDecision[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const definition of canonical) {
    const hosted = hostedBySlug.get(definition.slug);
    const { row, changes } = buildCategoryUpsertRow(definition, hosted);

    if (!hosted) {
      created += 1;
      decisions.push({
        slug: definition.slug,
        operation: "create",
        id: row.id,
        imageUrl: row.image_url,
        changes,
      });
      continue;
    }

    if (changes.length === 0) {
      skipped += 1;
      decisions.push({
        slug: definition.slug,
        operation: "skip",
        id: hosted.id,
        imageUrl: resolveHostedImageUrl(definition.slug, hosted, definition),
        changes,
      });
      continue;
    }

    updated += 1;
    decisions.push({
      slug: definition.slug,
      operation: "update",
      id: row.id,
      imageUrl: row.image_url,
      changes,
    });
  }

  const extraHosted = input.hosted
    .filter((row) => !canonicalSlugSet.has(row.slug))
    .map((row) => ({ id: row.id, slug: row.slug, name: row.name }));

  return {
    dryRun: input.dryRun,
    created,
    updated,
    skipped,
    decisions,
    extraHosted,
  };
}

async function writeCategorySyncAudit(
  supabase: SupabaseClient,
  input: {
    actorId?: string | null;
    actorRole?: string | null;
    plan: CategorySyncPlan;
    applied: boolean;
  },
): Promise<number | null> {
  const { data, error } = await supabase
    .from("catalog_audit_log")
    .insert({
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole ?? "service_role",
      action: input.plan.dryRun ? "category.sync.preview" : "category.sync",
      product_id: null,
      metadata: {
        applied: input.applied,
        dryRun: input.plan.dryRun,
        created: input.plan.created,
        updated: input.plan.updated,
        skipped: input.plan.skipped,
        slugs: input.plan.decisions.map((decision) => decision.slug),
        extraHosted: input.plan.extraHosted,
      },
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[category-sync] audit log write failed", error.message);
    return null;
  }

  return data?.id ?? null;
}

export async function fetchHostedCategories(
  supabase: SupabaseClient,
): Promise<HostedCategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, slug, name, description, image_url, seo_title, status, position, stage_preset, active, published_at, sort_order",
    )
    .order("position");

  if (error) {
    throw new Error(`Kategoriler okunamadı: ${error.message}`);
  }

  return (data ?? []) as HostedCategoryRow[];
}

export async function syncCanonicalCategories(input: {
  supabase: SupabaseClient;
  dryRun?: boolean;
  actorId?: string | null;
  actorRole?: string | null;
}): Promise<CategorySyncResult> {
  const dryRun = input.dryRun ?? false;
  const hosted = await fetchHostedCategories(input.supabase);
  const plan = planCategorySync({ hosted, dryRun });

  if (dryRun) {
    const auditLogId = await writeCategorySyncAudit(input.supabase, {
      actorId: input.actorId,
      actorRole: input.actorRole,
      plan,
      applied: false,
    });
    return { ...plan, applied: false, auditLogId };
  }

  for (const decision of plan.decisions) {
    if (decision.operation === "skip") {
      continue;
    }

    const canonical = listCanonicalCategories().find(
      (item) => item.slug === decision.slug,
    );
    if (!canonical) {
      continue;
    }

    const hostedRow = hosted.find((row) => row.slug === decision.slug);
    const { row } = buildCategoryUpsertRow(canonical, hostedRow);
    const result = await input.supabase.from("categories").upsert(row, {
      onConflict: "slug",
    });

    if (result.error) {
      throw new Error(
        `Kategori senkronizasyonu başarısız (${decision.slug}): ${result.error.message}`,
      );
    }
  }

  const auditLogId = await writeCategorySyncAudit(input.supabase, {
    actorId: input.actorId,
    actorRole: input.actorRole,
    plan,
    applied: true,
  });

  return { ...plan, applied: true, auditLogId };
}

export async function assignProductPrimaryCategory(input: {
  supabase: SupabaseClient;
  productId: string;
  categorySlug: string;
}): Promise<{ assigned: boolean; categoryId: string }> {
  const categoryResult = await input.supabase
    .from("categories")
    .select("id")
    .eq("slug", input.categorySlug)
    .maybeSingle();

  if (categoryResult.error || !categoryResult.data?.id) {
    throw new Error(`Kategori bulunamadı: ${input.categorySlug}`);
  }

  const categoryId = categoryResult.data.id;

  const clearPrimary = await input.supabase
    .from("product_categories")
    .update({ is_primary: false })
    .eq("product_id", input.productId);
  if (clearPrimary.error) {
    throw new Error(
      `Birincil kategori işaretleri temizlenemedi: ${clearPrimary.error.message}`,
    );
  }

  const upsert = await input.supabase.from("product_categories").upsert(
    {
      product_id: input.productId,
      category_id: categoryId,
      is_primary: true,
      position: 0,
    },
    { onConflict: "product_id,category_id" },
  );
  if (upsert.error) {
    throw new Error(`Kategori ataması yazılamadı: ${upsert.error.message}`);
  }

  const primaryUpdate = await input.supabase
    .from("product_categories")
    .update({ is_primary: true })
    .eq("product_id", input.productId)
    .eq("category_id", categoryId);
  if (primaryUpdate.error) {
    throw new Error(
      `Birincil kategori ayarlanamadı: ${primaryUpdate.error.message}`,
    );
  }

  return { assigned: true, categoryId };
}
