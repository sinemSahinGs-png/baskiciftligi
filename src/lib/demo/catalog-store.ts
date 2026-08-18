import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { demoCatalogSnapshot } from "@/domain/catalog/demo-data";
import type {
  CatalogSnapshot,
  Category,
  Product,
} from "@/domain/catalog/types";
import { resolveCategoryCoverUrl } from "@/lib/catalog/category-cover";
import { allowDemoAdminMutations } from "@/lib/env.server";

const dataDirectory = path.join(process.cwd(), ".octo-data");
const catalogFile = path.join(dataDirectory, "catalog.json");

function withPngCategoryCovers(snapshot: CatalogSnapshot): CatalogSnapshot {
  return {
    ...snapshot,
    categories: snapshot.categories.map((category) => ({
      ...category,
      imageUrl: resolveCategoryCoverUrl(category.slug, category.imageUrl),
    })),
  };
}

function baseSnapshot(): CatalogSnapshot {
  return withPngCategoryCovers(structuredClone(demoCatalogSnapshot));
}

export async function loadDemoCatalog(): Promise<CatalogSnapshot> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Yerel .octo-data/catalog.json üretimde okunmaz. Kalıcı katalog için Supabase yapılandırın.",
    );
  }

  if (process.env.NODE_ENV !== "development") {
    return baseSnapshot();
  }

  try {
    const contents = await readFile(catalogFile, "utf8");
    return withPngCategoryCovers(JSON.parse(contents) as CatalogSnapshot);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";

    if (code !== "ENOENT") {
      console.warn(
        "[Octo Studio] Yerel demo kataloğu okunamadı, tohum verisi kullanılıyor.",
      );
    }

    return baseSnapshot();
  }
}

export async function saveDemoCatalog(
  snapshot: CatalogSnapshot,
): Promise<void> {
  if (!allowDemoAdminMutations) {
    throw new Error(
      "Yerel demo mutasyonları kapalı. Supabase yapılandırın veya geliştirme ortamında ALLOW_DEMO_ADMIN_MUTATIONS=true kullanın.",
    );
  }

  await mkdir(dataDirectory, { recursive: true });
  await writeFile(
    catalogFile,
    `${JSON.stringify(
      { ...snapshot, updatedAt: new Date().toISOString() },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

export async function upsertDemoProduct(product: Product): Promise<Product> {
  const snapshot = await loadDemoCatalog();
  const index = snapshot.products.findIndex((item) => item.id === product.id);
  const nextProduct = { ...product, isDemo: true };

  if (index >= 0) {
    snapshot.products[index] = nextProduct;
  } else {
    snapshot.products.unshift(nextProduct);
  }

  await saveDemoCatalog(snapshot);
  return nextProduct;
}

export async function removeDemoProduct(productId: string): Promise<void> {
  const snapshot = await loadDemoCatalog();
  snapshot.products = snapshot.products.filter(
    (product) => product.id !== productId,
  );
  await saveDemoCatalog(snapshot);
}

export async function upsertDemoCategory(
  category: Category,
): Promise<Category> {
  const snapshot = await loadDemoCatalog();
  const index = snapshot.categories.findIndex((item) => item.id === category.id);
  const nextCategory = { ...category, isDemo: true };

  if (index >= 0) {
    snapshot.categories[index] = nextCategory;
  } else {
    snapshot.categories.push(nextCategory);
  }

  snapshot.categories.sort((a, b) => a.position - b.position);
  await saveDemoCatalog(snapshot);
  return nextCategory;
}

export async function removeDemoCategory(categoryId: string): Promise<void> {
  const snapshot = await loadDemoCatalog();
  const category = snapshot.categories.find((item) => item.id === categoryId);

  if (!category) {
    return;
  }

  if (
    snapshot.products.some((product) =>
      product.categorySlugs.includes(category.slug),
    )
  ) {
    throw new Error("Ürün atanmış bir kategori silinemez.");
  }

  snapshot.categories = snapshot.categories.filter(
    (item) => item.id !== categoryId,
  );
  await saveDemoCatalog(snapshot);
}
