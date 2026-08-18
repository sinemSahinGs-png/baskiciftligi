import { publicEnv } from "@/lib/env";

export const PRODUCTION_SITE_URL = "https://baskiciftligi.com";

const siteUrl =
  publicEnv.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? PRODUCTION_SITE_URL
    : "http://localhost:3000");

export const siteConfig = {
  name: "Baskı Çiftliği",
  shortName: "Baskı Çiftliği",
  legalName: "Baskı Çiftliği",
  wordmark: "Baskı Çiftliği",
  asciiId: "baskiciftligi",
  tagline: "Modelini seç, dosyanı yükle; biz üretelim.",
  description:
    "Hazır ürünleri keşfet, baskıya uygun modeller arasından seçim yap veya kendi 3D dosyanı yükleyerek üretim talebi oluştur.",
  collectionLabel: "Baskı Çiftliği Koleksiyonu",
  bylineLabel: "Baskı Çiftliği tarafından",
  studioLabel: "Baskı Çiftliği stüdyo",
  footerHeading: "Modelini seç, dosyanı yükle; biz üretelim.",
  footerDescription:
    "Hazır koleksiyonlar, kişiye özel ürünler ve kontrollü 3D baskı üretimi Baskı Çiftliği’nde.",
  url: siteUrl,
  domain: new URL(siteUrl).hostname,
  locale: "tr_TR",
  language: "tr",
  currency: "TRY" as const,
  city: "Ankara",
  logo: {
    src: "/icon.svg",
    markLabel: "Marka işareti",
  },
  hero: {
    eyebrow: "Online 3D üretim platformu",
    headline: "Fikrini yükle. Biz üretelim.",
    description:
      "Hazır ürünleri keşfet, baskıya uygun bir model seç veya kendi dosyanı yükleyerek üretimini başlat.",
    primaryCtaLabel: "Mağazayı keşfet",
    secondaryCtaLabel: "Model yükle",
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
    { label: "Kurumsal", href: "/kurumsal-uretim" },
  ],
  navigation: [
    { label: "Mağaza", href: "/magaza" },
    { label: "Kategoriler", href: "/magaza" },
    { label: "Model Yükle", href: "/model-yukle" },
    { label: "Hazır Modeller", href: "/hazir-modeller" },
    { label: "Kurumsal", href: "/kurumsal-uretim" },
    { label: "Hizmetler", href: "/hizmetler" },
    { label: "Hakkımızda", href: "/hakkimizda" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
