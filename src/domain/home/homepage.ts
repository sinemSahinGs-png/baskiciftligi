import type { Route } from "next";

import { siteConfig } from "@/config/site";
import type { ProductQuery } from "@/domain/catalog/types";

export const homepageMedia = {
  videoUrl: siteConfig.hero.videoUrl,
  videoWebmUrl: siteConfig.hero.webmUrl,
  posterUrl: siteConfig.hero.posterUrl,
} as const;

export const homepageHeroCopy = {
  eyebrow: siteConfig.hero.eyebrow,
  headline: siteConfig.hero.headline.replace(". ", ".\n"),
  description: siteConfig.hero.description,
  primaryCta: { label: siteConfig.hero.primaryCtaLabel, href: "/magaza" as Route },
  secondaryCta: {
    label: siteConfig.hero.secondaryCtaLabel,
    href: "/model-yukle" as Route,
  },
  trust: [
    "Güvenli ödeme altyapısı hazırlanıyor",
    "Üretim öncesi kontrol",
    "Türkiye geneli teslimat",
  ],
  instruments: [
    { label: "Mağazadan ürün seç", href: "/magaza" as Route },
    { label: "Hazır model seç", href: "/hazir-modeller" as Route },
    { label: "Dosyanı yükle", href: "/model-yukle" as Route },
  ],
} as const;

export const homepageFeaturedCollections = [
  {
    slug: "biblo-ve-heykel",
    title: "Heykelsi Objeler",
    description: "Formu önde tutan, vitrin ve koleksiyon için üretilen parçalar.",
    size: "large" as const,
  },
  {
    slug: "masaustu-aksesuarlari",
    title: "Masaüstü Tasarımları",
    description: "Günlük masaya ölçülü, işlevli objeler.",
    size: "small" as const,
  },
  {
    slug: "kisiye-ozel-urunler",
    title: "Kişiselleştirilebilir Ürünler",
    description: "İsim, renk ve ölçüyle size özel üretim.",
    size: "small" as const,
  },
] as const;

export const homepageShopCategorySlugs = [
  "ev-ve-dekorasyon",
  "biblo-ve-heykel",
  "anahtarlik",
  "magnet",
  "masaustu-aksesuarlari",
  "kisiye-ozel-urunler",
  "fonksiyonel-parcalar",
  "kurumsal-promosyon",
] as const;

export const homepageJourneys = [
  {
    id: "hazir-urun",
    title: "Hazır Ürün Satın Al",
    description:
      "Koleksiyondan rengi seç, fiyatı gör, sepete ekle. Üretim ve teslimat stüdyoda ilerler.",
    href: "/magaza" as Route,
    cta: "Mağazayı aç",
  },
  {
    id: "model-yukle",
    title: "Modelini Yükle",
    description:
      "STL, 3MF veya OBJ dosyanı getir. Seçenekleri belirle; kesin fiyat üretim değerlendirmesinden sonra netleşir.",
    href: "/model-yukle" as Route,
    cta: "Dosya ile başla",
  },
  {
    id: "hazir-model",
    title: "Hazır Model Seç",
    description:
      "Doğrulanmış modellerden birini seç, baskı seçeneklerini belirle, üretimi stüdyoya bırak.",
    href: "/hazir-modeller" as Route,
    cta: "Modelleri gör",
  },
] as const;

export const homepageProcessSteps = [
  {
    number: "01",
    title: "Seç veya yükle",
    description: "Katalogdan bir nesne al, hazır model seç veya kendi dosyanı getir.",
  },
  {
    number: "02",
    title: "Üretimi yapılandır",
    description: "Teknoloji, malzeme ve kaliteyi sen belirle.",
  },
  {
    number: "03",
    title: "Fiyatı gör",
    description: "Hazır üründe anlık fiyat; yüklemede değerlendirme sonrası netleşir.",
  },
  {
    number: "04",
    title: "Biz üretelim",
    description: "Kontrollü üretim ve son işlem stüdyoda ilerler.",
  },
  {
    number: "05",
    title: "Kapına gelsin",
    description: "Paket hazır olduğunda kargo bilgisi paylaşılır.",
  },
] as const;

export const homepageMaterialOrder = [
  "pla",
  "petg",
  "tpu",
  "asa",
  "standart-recine",
] as const;

export const homepageMaterialCopy: Record<
  (typeof homepageMaterialOrder)[number],
  { benefit: string; usage: string }
> = {
  pla: {
    benefit: "Temiz yüzey, kolay üretim",
    usage: "Dekoratif objeler ve iç mekân parçaları",
  },
  petg: {
    benefit: "Darbe ve neme daha dayanıklı",
    usage: "Günlük işlevsel ev parçaları",
  },
  tpu: {
    benefit: "Esnek ve sönümleyici",
    usage: "Conta, tampon ve koruyucu elemanlar",
  },
  asa: {
    benefit: "UV ve dış ortam direnci",
    usage: "Güneş gören yüzeyler ve dış mekân detayları",
  },
  "standart-recine": {
    benefit: "İnce detay ve pürüzsüz yüzey",
    usage: "Minyatür ve yüksek çözünürlüklü prototip",
  },
};

export const homepageCorporateOffers = [
  { title: "Promosyon ürünleri", description: "Markalı küçük objeler ve masaüstü parçalar." },
  { title: "Seri üretim", description: "Tekrarlı, kontrollü küçük ve orta ölçek." },
  { title: "Prototip", description: "Form ve ölçü doğrulaması için numune." },
  { title: "Yedek parça", description: "Ölçüsü net teknik yedekler." },
  { title: "Teknik model", description: "Fikstür ve üretim yardımcıları." },
  { title: "Kurumsal özel tasarım", description: "Brief’ten üretime markaya özel form." },
] as const;

export const homepageDemoReviews = [
  {
    id: "demo-review-01",
    name: "E. Kaya",
    city: "Ankara",
    quote:
      "Kart üzerindeki fiyat ve teslim aralığı alışveriş kararını netleştirdi. Bu metin yayınlanmış bir müşteri yorumu değildir.",
    product: "Flux Vazo — Demo",
  },
  {
    id: "demo-review-02",
    name: "M. Demir",
    city: "İzmir",
    quote:
      "Masaüstü düzenleyici formu masada dengeli duruyor. Demo yerleşim metnidir.",
    product: "Dock Masaüstü Düzenleyici — Demo",
  },
  {
    id: "demo-review-03",
    name: "S. Yıldız",
    city: "İstanbul",
    quote:
      "Model yükleme adımı dosyayı işlemez; değerlendirme akışına geçiş için yer tutar.",
    product: "Model yükleme akışı",
  },
] as const;

export const homepagePrintLibrary = [
  {
    id: "lattice-vazo-konsepti",
    name: "Lattice Vazo Konsepti",
    creator: siteConfig.bylineLabel,
    licenseLabel: "Stüdyo sahibi",
    licenseStatus: "owned" as const,
    category: "Ev ve Dekorasyon",
    startingPriceMinor: 74900,
    imageUrl: "/demo/products/flux-vazo.svg",
    href: "/hazir-modeller/octo-demo/lattice-vazo-konsepti" as Route,
  },
  {
    id: "moduler-masaustu-konsepti",
    name: "Modüler Masaüstü Konsepti",
    creator: siteConfig.bylineLabel,
    licenseLabel: "Stüdyo sahibi",
    licenseStatus: "owned" as const,
    category: "Masaüstü Aksesuarları",
    startingPriceMinor: 62900,
    imageUrl: "/demo/products/dock-organizer.svg",
    href: "/hazir-modeller/octo-demo/moduler-masaustu-konsepti" as Route,
  },
  {
    id: "organik-aydinlatma-konsepti",
    name: "Organik Aydınlatma Konsepti",
    creator: siteConfig.bylineLabel,
    licenseLabel: "Stüdyo sahibi",
    licenseStatus: "owned" as const,
    category: "Ev ve Dekorasyon",
    startingPriceMinor: 128900,
    imageUrl: "/demo/products/orbit-lamba.svg",
    href: "/hazir-modeller/octo-demo/organik-aydinlatma-konsepti" as Route,
  },
  {
    id: "licensed-bust-placeholder",
    name: "Koleksiyon Büstü — Lisanslı yer tutucu",
    creator: "Doğrulanmış yaratıcı (demo)",
    licenseLabel: "Lisanslı yer tutucu",
    licenseStatus: "licensed-placeholder" as const,
    category: "Biblo ve Heykel",
    startingPriceMinor: 98900,
    imageUrl: "/demo/products/mono-bust.svg",
    href: "/hazir-modeller" as Route,
  },
] as const;

export const homepageGallery = [
  {
    id: "gallery-digital",
    title: "Dijital model",
    caption: "Üretim öncesi yüzey kontrolü.",
    imageUrl: "/demo/products/flux-vazo-detail.svg",
    isolated: false,
  },
  {
    id: "gallery-physical",
    title: "Fiziksel ürün",
    caption: "Aynı form, katman dokusu görünür.",
    imageUrl: "/demo/products/flux-vazo.svg",
    isolated: true,
  },
  {
    id: "gallery-workshop-1",
    title: "Atölye",
    caption: "Demo stüdyo görseli.",
    imageUrl: "/demo/categories/fonksiyonel.svg",
    isolated: false,
  },
  {
    id: "gallery-workshop-2",
    title: "Yüzey kontrolü",
    caption: "Demo içerik.",
    imageUrl: "/demo/categories/heykel.svg",
    isolated: true,
  },
] as const;

export function parseStoreQuery(
  searchParams: Record<string, string | string[] | undefined>,
): ProductQuery {
  const read = (key: string, max = 80) => {
    const value = searchParams[key];
    const first = Array.isArray(value) ? value[0] : value;
    return first?.trim().slice(0, max) ?? "";
  };
  const numberValue = (key: string) => {
    const raw = Number(read(key, 12));
    return Number.isFinite(raw) && raw > 0 ? raw : undefined;
  };

  return {
    query: read("q") || undefined,
    category: read("category", 120) || undefined,
    collection: read("koleksiyon", 120) || undefined,
    sort: (["featured", "newest", "price_asc", "price_desc"] as const).includes(
      read("siralama") as ProductQuery["sort"] & string,
    )
      ? (read("siralama") as ProductQuery["sort"])
      : undefined,
    kind:
      read("stok") === "hazir"
        ? "ready_stock"
        : read("stok") === "siparis"
          ? "made_to_order"
          : undefined,
    color: read("renk") || undefined,
    minPriceMinor: numberValue("min") ? numberValue("min")! * 100 : undefined,
    maxPriceMinor: numberValue("max") ? numberValue("max")! * 100 : undefined,
    inStock: read("uygunluk") === "stokta" ? true : undefined,
    personalizable: read("kisisel") === "1" ? true : undefined,
    maxLeadDays: numberValue("sure"),
    material: read("malzeme") || undefined,
    page: numberValue("sayfa"),
    pageSize: 24,
  };
}
