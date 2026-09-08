import type { Category, Product } from "@/domain/catalog/types";

export type CartLineDisplayKind =
  | "store"
  | "personalized"
  | "uploaded"
  | "licensed";

export function isPersonalizableProduct(product: {
  categorySlugs: string[];
  collectionSlugs: string[];
}) {
  return (
    product.categorySlugs.includes("kisiye-ozel-urunler") ||
    product.collectionSlugs.includes("sana-ozel")
  );
}

export function displayKindForProduct(product: Product): CartLineDisplayKind {
  if (isPersonalizableProduct(product)) {
    return "personalized";
  }

  return "store";
}

export type StoreProductActionKind = "add" | "options" | "personalize";

export function storeProductAction(product: Product): {
  kind: StoreProductActionKind;
  label: string;
} {
  if (
    isPersonalizableProduct(product) ||
    product.personalizationEnabled === true
  ) {
    return { kind: "personalize", label: "KİŞİSELLEŞTİR" };
  }

  const activeVariants = product.variants.filter((variant) => variant.isActive);
  if (activeVariants.length > 1) {
    return { kind: "options", label: "SEÇENEKLERİ GÖR" };
  }

  return { kind: "add", label: "SEPETE EKLE" };
}

export const categoryClusters: Record<string, string[]> = {
  "ev-ve-dekorasyon": ["biblo-ve-heykel", "magnet", "yeni-gelenler"],
  "biblo-ve-heykel": ["ev-ve-dekorasyon", "kisiye-ozel-urunler"],
  "masaustu-aksesuarlari": ["fonksiyonel-parcalar", "anahtarlik"],
  "kisiye-ozel-urunler": [
    "anahtarlik",
    "magnet",
    "organizasyon-urunleri",
    "kurumsal-promosyon",
  ],
  "fonksiyonel-parcalar": ["masaustu-aksesuarlari", "kurumsal-promosyon"],
  anahtarlik: ["kisiye-ozel-urunler", "magnet", "organizasyon-urunleri"],
  magnet: ["kisiye-ozel-urunler", "anahtarlik", "ev-ve-dekorasyon"],
  "organizasyon-urunleri": ["kisiye-ozel-urunler", "kurumsal-promosyon"],
  "kurumsal-promosyon": ["organizasyon-urunleri", "fonksiyonel-parcalar"],
  "yeni-gelenler": ["ev-ve-dekorasyon", "biblo-ve-heykel"],
};

export function relatedCategorySlugs(slug: string) {
  return categoryClusters[slug] ?? [];
}

export function categoryAfterword(category: Category) {
  return {
    title: `${category.name} hakkında`,
    paragraphs: [
      category.description,
      "Bu seçkideki parçalar stüdyoda, seçilen malzeme ve üretim süresine göre hazırlanır. Sayfadaki metin bir kapasite, stok veya teslim garantisi değildir.",
    ],
  };
}
