import { publicEnv } from "@/lib/env";

export const PRODUCTION_SITE_URL = "https://baskiciftligi.com";

const siteUrl =
  publicEnv.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? PRODUCTION_SITE_URL
    : "http://localhost:3000");

export const siteConfig = {
  name: "OCTO STUDIO",
  shortName: "OCTO",
  legalName: "Baskı Çiftliği",
  wordmark: "OCTO STUDIO",
  asciiId: "octostudio",
  tagline: "Fikirden fiziksel ürüne.",
  description:
    "Hazır ürünleri keşfet, baskıya uygun modeller arasından seçim yap veya kendi 3D dosyanı yükleyerek üretim talebi oluştur.",
  collectionLabel: "OCTO STUDIO Koleksiyonu",
  bylineLabel: "OCTO STUDIO tarafından",
  studioLabel: "OCTO STUDIO",
  footerHeading: "Fikrini yüzeye çıkar.",
  footerDescription:
    "3D tasarım, hazır ürün, özel üretim ve kurumsal promosyon — tek noktadan tasarım ve üretim.",
  url: siteUrl,
  domain: new URL(siteUrl).hostname,
  locale: "tr_TR",
  language: "tr",
  currency: "TRY" as const,
  city: "Ankara",
  logo: {
    src: "/icon.svg",
    markLabel: "OCTO STUDIO işareti",
  },
  hero: {
    eyebrow: "YARATICI ÜRETİM STÜDYOSU",
    headline: "FİKRİNİ DERİNLİKTEN ÇIKAR.",
    description:
      "Modelini seç, dosyanı yükle veya fikrini anlat. Octo Studio onu gerçek bir ürüne dönüştürsün.",
    primaryCtaLabel: "MODELLERİ KEŞFET",
    secondaryCtaLabel: "MODELİNİ YÜKLE",
    videoUrl:
      publicEnv.NEXT_PUBLIC_HOME_HERO_VIDEO_URL ?? "/demo/hero/placeholder.mp4",
    webmUrl: publicEnv.NEXT_PUBLIC_HOME_HERO_WEBM_URL,
    posterUrl:
      publicEnv.NEXT_PUBLIC_HOME_HERO_POSTER_URL ?? "/demo/hero/poster.jpg",
  },
  contact: {
    email: publicEnv.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
    phone: publicEnv.NEXT_PUBLIC_CONTACT_PHONE ?? "",
  },
  social: {
    instagram: publicEnv.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    youtube: publicEnv.NEXT_PUBLIC_YOUTUBE_URL ?? "",
  },
  primaryNavigation: [
    { label: "Mağaza", href: "/magaza" },
    { label: "Model Yükle", href: "/model-yukle" },
    { label: "Hazır Modeller", href: "/hazir-modeller" },
    { label: "Toptan & Bayiler", href: "/toptan" },
  ],
  navigation: [
    { label: "Mağaza", href: "/magaza" },
    { label: "Model Yükle", href: "/model-yukle" },
    { label: "Hazır Modeller", href: "/hazir-modeller" },
    { label: "Toptan & Bayiler", href: "/toptan" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
