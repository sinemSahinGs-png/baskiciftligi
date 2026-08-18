import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Product } from "@/domain/catalog/types";
import {
  indexExistingCatalog,
  planCatalogImport,
  type CatalogImportPlan,
} from "@/lib/catalog/migration/plan";
import type { CatalogExportDocument } from "@/lib/catalog/migration/schema";

function mapStatus(status: Product["status"]) {
  return status === "scheduled" ? "draft" : status;
}

async function loadExistingStubs(supabase: SupabaseClient) {
  const [{ data: products, error: productError }, { data: categories }, { data: collections }] =
    await Promise.all([
      supabase.from("products").select("id, sku, slug, status, published_at, featured"),
      supabase.from("categories").select("id, slug, name, description"),
      supabase.from("collections").select("id, slug, name"),
    ]);

  if (productError) {
    throw new Error(productError.message);
  }

  return indexExistingCatalog({
    products: (products ?? []).map((row) => ({
      id: row.id,
      sku: row.sku ?? "",
      slug: row.slug,
      name: row.slug,
      shortDescription: "",
      description: "",
      status: row.status === "active" ? "active" : row.status === "archived" ? "archived" : "draft",
      kind: "ready_stock",
      priceMinor: 0,
      compareAtPriceMinor: null,
      currency: "TRY",
      inventoryQuantity: 0,
      productionLeadTimeDays: { min: 0, max: 0 },
      categorySlugs: [],
      collectionSlugs: [],
      media: [],
      variants: [],
      badges: [],
      featured: row.featured === true,
      seoTitle: "",
      seoDescription: "",
      publishedAt: row.published_at,
      isDemo: false,
    })),
    categories: (categories ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? "",
      imageUrl: "",
      eyebrow: "",
      isFeatured: false,
      position: 0,
      isDemo: false,
    })),
    collections: (collections ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: "",
      productSlugs: [],
      isDemo: false,
    })),
  });
}

export async function commitCatalogImportToSupabase(input: {
  document: CatalogExportDocument;
  supabaseUrl: string;
  serviceRoleKey: string;
}) {
  const supabase = createClient(input.supabaseUrl, input.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const existing = await loadExistingStubs(supabase);
  const plan = planCatalogImport({
    document: input.document,
    existing,
    dryRun: false,
  });
  if (plan.errors.length) {
    return { plan, wrote: false };
  }

  const created: string[] = [];
  try {
    await applySupabasePlan(supabase, plan, created);
    await supabase.rpc("write_catalog_audit", {
      audit_action: "catalog_import_commit",
      audit_product_id: null,
      audit_metadata: {
        creates: plan.creates,
        updates: plan.updates,
      },
    });
  } catch (error) {
    for (const id of created.reverse()) {
      await supabase.from("products").delete().eq("id", id);
    }
    throw error;
  }

  return { plan, wrote: true };
}

async function applySupabasePlan(
  supabase: SupabaseClient,
  plan: CatalogImportPlan,
  created: string[],
) {
  for (const category of plan.categories) {
    const result = await supabase.from("categories").upsert(
      {
        name: category.category.name,
        slug: category.slug,
        description: category.category.description,
        status: "published",
      },
      { onConflict: "slug" },
    );
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  for (const decision of plan.products) {
    const product = decision.product;
    const row = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      short_description: product.shortDescription,
      description: product.description,
      status: mapStatus(product.status),
      base_price_minor: product.priceMinor,
      compare_at_price_minor: product.compareAtPriceMinor,
      currency: "TRY",
      sku: product.sku,
      featured: product.featured,
      seo_title: product.seoTitle,
      seo_description: product.seoDescription,
      published_at: product.publishedAt,
      metadata: {
        kind: product.kind,
        sku: product.sku,
        featured: product.featured,
        badges: product.badges,
      },
    };
    const result = await supabase.from("products").upsert(row, { onConflict: "id" });
    if (result.error) {
      throw new Error(result.error.message);
    }
    if (decision.op === "create") {
      created.push(product.id);
    }
  }
}
