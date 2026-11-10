import type { Route } from "next";

import type { Product, ProductVariant } from "@/domain/catalog/types";

export type ProjectSource = "orbia" | "memoora" | "cep_album";

export type ProjectDestinationSlug = "orbia" | "memoora" | "cep-album";

export interface ProjectDestination {
  slug: ProjectDestinationSlug;
  source: ProjectSource;
  name: string;
  eyebrow: string;
  description: string;
  href: Route;
  artwork: string;
  logo: string;
  heroVideoDesktop: string;
  heroVideoMobile: string;
  heroPoster: string;
  delivery: string;
  faq: ReadonlyArray<{ q: string; a: string }>;
  purchasable: boolean;
  priceMissingNote: string | null;
}

const PUBLISHED = "2024-01-01T00:00:00.000Z";

const ORBIA_SIGNS = [
  { id: "koc", name: "Koç" },
  { id: "boga", name: "Boğa" },
  { id: "ikizler", name: "İkizler" },
  { id: "yengec", name: "Yengeç" },
  { id: "aslan", name: "Aslan" },
  { id: "basak", name: "Başak" },
  { id: "terazi", name: "Terazi" },
  { id: "akrep", name: "Akrep" },
  { id: "yay", name: "Yay" },
  { id: "oglak", name: "Oğlak" },
  { id: "kova", name: "Kova" },
  { id: "balik", name: "Balık" },
] as const;

function variant(id: string, name: string): ProductVariant {
  return {
    id,
    name,
    sku: id,
    priceAdjustmentMinor: 0,
    inventoryQuantity: 99,
    isActive: true,
  };
}

function product(input: {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMinor: number;
  image: string;
  source: ProjectSource;
  variants?: ProductVariant[];
  inventoryQuantity?: number;
}): Product {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    shortDescription: input.description,
    description: input.description,
    status: "active",
    kind: "made_to_order",
    priceMinor: input.priceMinor,
    compareAtPriceMinor: null,
    currency: "TRY",
    sku: input.id,
    inventoryQuantity: input.inventoryQuantity ?? 99,
    inventoryPolicy: "continue",
    productionLeadTimeDays: { min: 4, max: 14 },
    categorySlugs: [`project:${input.source}`],
    collectionSlugs: [],
    media: [
      {
        id: `${input.id}-img`,
        type: "image",
        url: input.image,
        alt: input.name,
        position: 0,
        role: "primary",
      },
    ],
    variants: input.variants ?? [],
    badges: [],
    featured: false,
    seoTitle: input.name,
    seoDescription: input.description,
    searchVisible: false,
    noindex: true,
    publishedAt: PUBLISHED,
    vatRateBps: 2000,
    isDemo: false,
  };
}

export const projectDestinations: readonly ProjectDestination[] = [
  {
    slug: "orbia",
    source: "orbia",
    name: "ORBIA",
    eyebrow: "Proje",
    description:
      "12 burca özel NFC anahtarlık. Telefonuna dokundurunca günlük gökyüzü deneyimi açılır.",
    href: "/kategori/orbia" as Route,
    artwork: "/categories/orbia/product.webp",
    logo: "/categories/orbia/logo.svg",
    heroVideoDesktop: "/categories/orbia/hero-desktop.mp4",
    heroVideoMobile: "/categories/orbia/hero-mobile.mp4",
    heroPoster: "/categories/orbia/poster.webp",
    delivery: "Kargo tutarı ödeme adımında sunucuda hesaplanır. Teslimat süresi ürün hazırlığına bağlıdır.",
    faq: [
      {
        q: "NFC nasıl çalışır?",
        a: "Anahtarlığı telefonunun NFC alanına yaklaştırınca Orbia burç deneyimi açılır.",
      },
      {
        q: "Fiyat neden görünmüyor?",
        a: "Kaynak Orbia projesinde satış fiyatı henüz yayınlanmamış. Fiyat uydurulmaz.",
      },
    ],
    purchasable: false,
    priceMissingNote:
      "Resmi satış fiyatı henüz girilmedi. Satış, fiyat yayınlandığında açılacak.",
  },
  {
    slug: "memoora",
    source: "memoora",
    name: "MEMOORA",
    eyebrow: "Proje",
    description:
      "NFC magnet veya anahtarlıkla açılan dijital düğün hatıra ağacı. 1 katkı = 1 yaprak.",
    href: "/kategori/memoora" as Route,
    artwork: "/categories/memoora/poster.png",
    logo: "/categories/memoora/logo.svg",
    heroVideoDesktop: "/categories/memoora/hero.mp4",
    heroVideoMobile: "/categories/memoora/hero.mp4",
    heroPoster: "/categories/memoora/poster.png",
    delivery: "Üretim ve kargo sunucuda hesaplanır. Düğün tarihi için kaynak projede en az 4 gün pay bırakılır.",
    faq: [
      {
        q: "Ne satın alıyorum?",
        a: "Kişiye özel NFC magnet veya NFC anahtarlık. Fiyatlar kaynak Memoora satış birimlerinden alınır; KDV dahildir.",
      },
      {
        q: "Ödeme nasıl alınır?",
        a: "OCTO STUDIO sepeti ve PayTR altyapısı kullanılır. Ödenen tutar yalnızca doğrulanmış geri bildirimle işaretlenir.",
      },
    ],
    purchasable: true,
    priceMissingNote: null,
  },
  {
    slug: "cep-album",
    source: "cep_album",
    name: "CEP ALBÜM",
    eyebrow: "Proje",
    description:
      "Mini albüm anahtarlığı. Tekli albümler 200 TL. Koleksiyon paketlerinin fiyatı kaynak projede yayınlanmamış.",
    href: "/kategori/cep-album" as Route,
    artwork: "/categories/cep-album/poster.webp",
    logo: "/categories/cep-album/product-hero.webp",
    heroVideoDesktop: "/categories/cep-album/hero.mp4",
    heroVideoMobile: "/categories/cep-album/hero.mp4",
    heroPoster: "/categories/cep-album/poster.webp",
    delivery: "Kargo tutarı ödeme adımında sunucuda hesaplanır.",
    faq: [
      {
        q: "Tekli albüm nedir?",
        a: "Kendi playlistini veya linkini taşıyan mini albüm anahtarlığı. Kaynak fiyatta 200 TL.",
      },
      {
        q: "Paketler neden yok?",
        a: "Hazır koleksiyon paketleri kaynak sitede “fiyat için iletişime geç” olarak duruyor. Fiyat uydurulmaz.",
      },
    ],
    purchasable: true,
    priceMissingNote: null,
  },
] as const;

const CEP_SINGLES = [
  {
    id: "gece-dansi",
    name: "Gece Dansı",
    description: "Kaset hissi ve unutulmayan nakaratlar. 90’lar pop gecesi.",
    image: "/categories/cep-album/preview-90lar.webp",
  },
  {
    id: "beton-beat",
    name: "Beton Beat",
    description: "Asfalt, bass, karanlık stüdyo. Türkçe rap enerjisi.",
    image: "/categories/cep-album/preview-rap.webp",
  },
  {
    id: "deri-ceket",
    name: "Deri Ceket",
    description: "Krom yansıma ve sahne arkası. Klasik rock ruhu.",
    image: "/categories/cep-album/preview-rock.webp",
  },
  {
    id: "gecelerin-sarkisi",
    name: "Gecelerin Şarkısı",
    description: "Dumanlı gece ve derin duygu. Arabesk / fantezi atmosferi.",
    image: "/categories/cep-album/preview-arabesk.webp",
  },
] as const;

function memooraProducts(): Product[] {
  return [
    product({
      id: "proj-memoora-magnet",
      slug: "memoora-magnet",
      name: "Kişiye Özel Magnet",
      description: "Baş harfler ve düğün tarihiyle özel üretim NFC magnet.",
      priceMinor: 6_600,
      image: "/categories/memoora/magnet.png",
      source: "memoora",
    }),
    product({
      id: "proj-memoora-keychain",
      slug: "memoora-keychain",
      name: "Anahtarlık",
      description: "Çiftin Memoora sayfasını tek dokunuşla açan NFC anahtarlık.",
      priceMinor: 5_400,
      image: "/categories/memoora/keychain.png",
      source: "memoora",
    }),
  ];
}

function cepAlbumProducts(): Product[] {
  return CEP_SINGLES.map((item) =>
    product({
      id: `proj-cep-album-${item.id}`,
      slug: `cep-album-${item.id}`,
      name: item.name,
      description: item.description,
      priceMinor: 20_000,
      image: item.image,
      source: "cep_album",
    }),
  );
}

function orbiaDisplayProduct(): Product {
  return product({
    id: "proj-orbia-keychain",
    slug: "orbia-keychain",
    name: "ORBIA Burç NFC Anahtarlık",
    description: "12 burca özel NFC anahtarlık. Kaynak projede fiyat yayınlanmamış.",
    priceMinor: 0,
    image: "/categories/orbia/product.webp",
    source: "orbia",
    inventoryQuantity: 0,
    variants: ORBIA_SIGNS.map((sign) => variant(`orbia-sign-${sign.id}`, sign.name)),
  });
}

export function getProjectDestination(
  slug: string,
): ProjectDestination | undefined {
  return projectDestinations.find((item) => item.slug === slug);
}

export function isProjectDestinationSlug(slug: string): slug is ProjectDestinationSlug {
  return projectDestinations.some((item) => item.slug === slug);
}

export function projectSourceFromProduct(product: Product): ProjectSource | null {
  const match = product.categorySlugs.find((slug) => slug.startsWith("project:"));
  if (!match) return null;
  const source = match.slice("project:".length);
  if (source === "orbia" || source === "memoora" || source === "cep_album") {
    return source;
  }
  return null;
}

export function listProjectCatalogProducts(): Product[] {
  return [...memooraProducts(), ...cepAlbumProducts()];
}

export function listProjectDisplayProducts(slug: ProjectDestinationSlug): Product[] {
  if (slug === "orbia") return [orbiaDisplayProduct()];
  if (slug === "memoora") return memooraProducts();
  return cepAlbumProducts();
}

export function findProjectCatalogProduct(id: string): Product | undefined {
  return [...listProjectCatalogProducts(), orbiaDisplayProduct()].find(
    (item) => item.id === id,
  );
}
