import type { Route } from "next";

export const STOREFRONT_CATEGORY_ASSET_DIR = "/images/categories";

export type StorefrontCategorySlug =
  | "dekorasyon-yasam"
  | "figur-heykel"
  | "oyuncak-hareketli-modeller"
  | "taraftara-ozel"
  | "anahtarlik-magnet"
  | "masaustu-fonksiyonel"
  | "kisiye-ozel";

export interface StorefrontCategory {
  slug: StorefrontCategorySlug;
  name: string;
  eyebrow: string;
  description: string;
  href: Route;
  assetFile: string;
  sourceSlugs: readonly string[];
  comingSoon: boolean;
}

export const storefrontCategories: readonly StorefrontCategory[] = [
  {
    slug: "dekorasyon-yasam",
    name: "Dekorasyon & Yaşam",
    eyebrow: "Ev",
    description: "Vazo, aydınlatma ve yaşam alanına ölçülü objeler.",
    href: "/kategori/dekorasyon-yasam" as Route,
    assetFile: "dekorasyon-yasam.png",
    sourceSlugs: ["ev-ve-dekorasyon"],
    comingSoon: false,
  },
  {
    slug: "figur-heykel",
    name: "Figür & Heykel",
    eyebrow: "Form",
    description: "Biblo, heykel ve koleksiyon parçaları.",
    href: "/kategori/figur-heykel" as Route,
    assetFile: "figur-heykel.png",
    sourceSlugs: ["biblo-ve-heykel"],
    comingSoon: false,
  },
  {
    slug: "oyuncak-hareketli-modeller",
    name: "Oyuncak & Hareketli Modeller",
    eyebrow: "Hareket",
    description: "Mafsallı, esnek ve hareketli baskılar için seçki.",
    href: "/kategori/oyuncak-hareketli-modeller" as Route,
    assetFile: "oyuncak-hareketli.png",
    sourceSlugs: [],
    comingSoon: true,
  },
  {
    slug: "taraftara-ozel",
    name: "Taraftara Özel",
    eyebrow: "Taraftar",
    description: "Takım ve taraftar temalı üretim seçkisi.",
    href: "/kategori/taraftara-ozel" as Route,
    assetFile: "taraftara-ozel.png",
    sourceSlugs: [],
    comingSoon: true,
  },
  {
    slug: "anahtarlik-magnet",
    name: "Anahtarlık & Magnet",
    eyebrow: "Küçük obje",
    description: "Anahtarlık, magnet ve kompakt günlük parçalar.",
    href: "/kategori/anahtarlik-magnet" as Route,
    assetFile: "anahtarlik-magnet.png",
    sourceSlugs: ["anahtarlik", "magnet"],
    comingSoon: false,
  },
  {
    slug: "masaustu-fonksiyonel",
    name: "Masaüstü & Fonksiyonel",
    eyebrow: "İşlev",
    description: "Stand, düzenleyici ve masaya ölçülü işlevsel parçalar.",
    href: "/kategori/masaustu-fonksiyonel" as Route,
    assetFile: "masaustu-fonksiyonel.png",
    sourceSlugs: ["masaustu-aksesuarlari", "fonksiyonel-parcalar"],
    comingSoon: false,
  },
  {
    slug: "kisiye-ozel",
    name: "Kişiye Özel",
    eyebrow: "Size özel",
    description: "İsim, ölçü ve renk seçenekleriyle kişiselleştirilen üretim.",
    href: "/kategori/kisiye-ozel" as Route,
    assetFile: "kisiye-ozel.png",
    sourceSlugs: ["kisiye-ozel-urunler"],
    comingSoon: false,
  },
] as const;

const REPLACED_CATEGORY_PATHS: ReadonlyArray<{
  destination: string;
  slugs: readonly string[];
}> = [
  { destination: "/kategori/dekorasyon-yasam", slugs: ["ev-ve-dekorasyon"] },
  { destination: "/kategori/figur-heykel", slugs: ["biblo-ve-heykel"] },
  { destination: "/kategori/anahtarlik-magnet", slugs: ["anahtarlik", "magnet"] },
  {
    destination: "/kategori/masaustu-fonksiyonel",
    slugs: ["masaustu-aksesuarlari", "fonksiyonel-parcalar"],
  },
  { destination: "/kategori/kisiye-ozel", slugs: ["kisiye-ozel-urunler"] },
];

export const STOREFRONT_CATEGORY_REDIRECTS: ReadonlyArray<{
  source: string;
  destination: string;
}> = [
  ...REPLACED_CATEGORY_PATHS.flatMap(({ destination, slugs }) =>
    slugs.flatMap((slug) => [
      { source: `/magaza/${slug}`, destination },
      { source: `/kategori/${slug}`, destination },
    ]),
  ),
  { source: "/magaza/kurumsal-promosyon", destination: "/toptan" },
  { source: "/kategori/kurumsal-promosyon", destination: "/toptan" },
];

const bySlug = new Map(storefrontCategories.map((item) => [item.slug, item]));
const sourceToStorefront = new Map<string, StorefrontCategorySlug>();
for (const category of storefrontCategories) {
  for (const source of category.sourceSlugs) {
    sourceToStorefront.set(source, category.slug);
  }
}

export function storefrontCategoryAsset(slug: StorefrontCategorySlug): string {
  const category = bySlug.get(slug);
  return `${STOREFRONT_CATEGORY_ASSET_DIR}/${category?.assetFile ?? `${slug}.png`}`;
}

export function getStorefrontCategory(
  slug: string,
): StorefrontCategory | undefined {
  return bySlug.get(slug as StorefrontCategorySlug);
}

export function storefrontSlugFromSource(sourceSlug: string): string | undefined {
  return sourceToStorefront.get(sourceSlug);
}

export function expandCategoryFilter(slug: string | undefined): string[] | undefined {
  if (!slug) return undefined;
  const storefront = getStorefrontCategory(slug);
  if (storefront) {
    return storefront.sourceSlugs.length > 0
      ? [...storefront.sourceSlugs]
      : [`__empty__${storefront.slug}`];
  }
  return [slug];
}

export function productMatchesStorefrontCategory(
  categorySlugs: readonly string[],
  requested?: string,
): boolean {
  if (!requested) return true;
  const expanded = expandCategoryFilter(requested);
  if (!expanded) return true;
  return expanded.some((slug) => categorySlugs.includes(slug));
}

export function countStorefrontProducts(
  products: Array<{ categorySlugs: readonly string[] }>,
  category: StorefrontCategory,
): number {
  if (category.sourceSlugs.length === 0) return 0;
  return products.filter((product) =>
    product.categorySlugs.some((slug) => category.sourceSlugs.includes(slug)),
  ).length;
}

export function publicCategoryHref(slug: string): Route {
  const direct = getStorefrontCategory(slug);
  if (direct) return direct.href;
  const mapped = storefrontSlugFromSource(slug);
  if (mapped) {
    const category = getStorefrontCategory(mapped);
    if (category) return category.href;
  }
  if (slug === "kurumsal-promosyon") return "/toptan" as Route;
  return `/magaza/${slug}` as Route;
}

export function storefrontFilterCategories(): StorefrontCategory[] {
  return storefrontCategories.filter((item) => !item.comingSoon);
}
