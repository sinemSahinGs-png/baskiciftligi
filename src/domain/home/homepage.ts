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

export const homepageIdeaPlaceholders = [
  "Ejderha şeklinde telefon standı",
  "Kedim için isimli mama kabı",
  "Duvara asılan gitar aparatı",
  "Araba için telefon tutucu",
  "Sevgiliye özel kalp anahtarlık",
  "Masaüstü kulaklık standı",
  "Noel temalı mumluk",
] as const;

export const homepageIdeaExamples = [
  {
    id: "telefon-standi",
    label: "Telefon standı",
    query: "telefon standı",
    imageUrl: "/demo/products/arc-stand.svg",
    tone: "cyan",
  },
  {
    id: "saksi",
    label: "Saksı",
    query: "saksı",
    imageUrl: "/demo/products/tidal-saksi.svg",
    tone: "lime",
  },
  {
    id: "anahtarlik",
    label: "Anahtarlık",
    query: "anahtarlık",
    imageUrl: "/demo/categories/anahtarlik.png",
    tone: "coral",
  },
  {
    id: "duvar-dekoru",
    label: "Duvar dekoru",
    query: "duvar dekoru",
    imageUrl: "/demo/categories/ev-ve-dekorasyon.png",
    tone: "violet",
  },
  {
    id: "masaustu",
    label: "Masaüstü düzenleyici",
    query: "masaüstü düzenleyici",
    imageUrl: "/demo/products/dock-organizer.svg",
    tone: "cobalt",
  },
  {
    id: "figur",
    label: "Figür",
    query: "figür",
    imageUrl: "/demo/products/mono-bust.svg",
    tone: "violet",
  },
  {
    id: "lamba",
    label: "Lamba",
    query: "lamba",
    imageUrl: "/demo/products/orbit-lamba.svg",
    tone: "cyan",
  },
  {
    id: "evcil",
    label: "Evcil hayvan ürünü",
    query: "evcil hayvan ürünü",
    imageUrl: "/demo/categories/kisiye-ozel-urunler.png",
    tone: "orange",
  },
] as const;

export const homepageJourneys = [
  {
    id: "fikrini-anlat",
    title: "Fikrini anlat",
    description: "Ne istediğini yaz, uygun modelleri bul.",
    href: "#ne-uretmek-istiyorsun" as Route,
    cta: "Fikrini yaz",
  },
  {
    id: "hazir-model",
    title: "Hazır model seç",
    description: "Thingiverse ve hazır kütüphaneden seçim yap.",
    href: "/hazir-modeller" as Route,
    cta: "Modelleri gör",
  },
  {
    id: "model-yukle",
    title: "Dosyanı yükle",
    description: "STL veya 3MF yükle, dilimlet ve fiyat al.",
    href: "/model-yukle" as Route,
    cta: "Dosya yükle",
  },
] as const;

export const homepageProcessCopy = {
  eyebrow: "Süreç",
  title: "Nasıl çalışır?",
  description:
    "Modelini seç veya yükle. Ölçü ve malzemeyi belirle. Gerçek baskı süresi ve gram üzerinden teklif al; biz üretip gönderelim.",
  cta: "Üretim yolunu seç",
  store: "Mağazayı keşfet",
  upload: "Model yükle",
} as const;

export const homepageProcessSteps = [
  {
    number: "01",
    kicker: "Seç",
    title: "Modelini seç veya yükle",
    description:
      "Fikrini yaz, hazır model seç veya STL / 3MF dosyanı stüdyoya bırak.",
  },
  {
    number: "02",
    kicker: "Ayarla",
    title: "Ölçü ve malzemeyi belirle",
    description: "Boyut, malzeme ve rengi kullanımına göre netleştir.",
  },
  {
    number: "03",
    kicker: "Teklif",
    title: "Gerçek süre ve gram üzerinden teklif al",
    description:
      "Fiyat, PrusaSlicer çıktısı ve imzalı formülle gelir. Dosya yoksa fiyat sözü yok.",
  },
  {
    number: "04",
    kicker: "Teslim",
    title: "Biz üretip gönderelim",
    description: "Kontrol, paketleme ve teslimat stüdyoda tamamlanır.",
  },
] as const;

export const homepageTrustSignals = [
  {
    title: "Üretim öncesi kontrol",
    description: "Baskıya gitmeden ölçü ve dosya uygunluğu kontrol edilir.",
  },
  {
    title: "Gerçek dilimleme",
    description: "Süre ve gram, PrusaSlicer 2.8.1 çıktısından okunur.",
  },
  {
    title: "İmzalı teklif",
    description: "Sepete giren fiyat, sunucuda üretilmiş imzalı kayıttır.",
  },
  {
    title: "Tek kargo",
    description: "100 TL ve üzeri siparişte kargo bir kez uygulanır.",
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
    imageUrl: "/demo/categories/fonksiyonel-parcalar.png",
    isolated: false,
  },
  {
    id: "gallery-workshop-2",
    title: "Yüzey kontrolü",
    caption: "Demo içerik.",
    imageUrl: "/demo/categories/biblo-ve-heykel.png",
    isolated: false,
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
