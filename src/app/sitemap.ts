import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import {
  listCategories,
  listMaterials,
  listProducts,
} from "@/domain/catalog/repository";

const staticPaths = [
  "",
  "/magaza",
  "/hazir-modeller",
  "/malzemeler",
  "/hizmetler",
  "/hizmetler/3d-baski",
  "/hizmetler/3d-modelleme",
  "/hizmetler/3d-tarama",
  "/hizmetler/prototip",
  "/kurumsal-uretim",
  "/kurumsal-teklif",
  "/hakkimizda",
  "/iletisim",
  "/sss",
  "/blog",
  "/yasal/kvkk",
  "/yasal/gizlilik",
  "/yasal/mesafeli-satis",
  "/yasal/iade",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, materials] = await Promise.all([
    listProducts(),
    listCategories(),
    listMaterials(),
  ]);
  const now = new Date();

  return [
    ...staticPaths.map((path, index) => ({
      url: new URL(path || "/", siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: index === 0 ? ("daily" as const) : ("weekly" as const),
      priority: index === 0 ? 1 : 0.7,
    })),
    ...products.map((product) => ({
      url: new URL(`/urun/${product.slug}`, siteConfig.url).toString(),
      lastModified: product.publishedAt
        ? new Date(product.publishedAt)
        : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      url: new URL(`/magaza/${category.slug}`, siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...materials.map((material) => ({
      url: new URL(`/malzemeler/${material.slug}`, siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
