import { siteConfig } from "@/config/site";

export interface SiteHeroContent {
  eyebrow: string;
  headline: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  videoUrl: string;
  posterUrl: string;
  webmUrl?: string;
}

export interface SiteContent {
  tagline: string;
  description: string;
  footerHeading: string;
  footerDescription: string;
  categoriesIntroTitle: string;
  categoriesIntroDescription: string;
  hero: SiteHeroContent;
}

export function defaultSiteContent(): SiteContent {
  return {
    tagline: siteConfig.tagline,
    description: siteConfig.description,
    footerHeading: siteConfig.footerHeading,
    footerDescription: siteConfig.footerDescription,
    categoriesIntroTitle: "Kategori dünyaları",
    categoriesIntroDescription: "Her seçki kendi sahnesinde durur.",
    hero: {
      eyebrow: siteConfig.hero.eyebrow,
      headline: siteConfig.hero.headline,
      description: siteConfig.hero.description,
      primaryCtaLabel: siteConfig.hero.primaryCtaLabel,
      secondaryCtaLabel: siteConfig.hero.secondaryCtaLabel,
      videoUrl: siteConfig.hero.videoUrl,
      posterUrl: siteConfig.hero.posterUrl,
      webmUrl: siteConfig.hero.webmUrl,
    },
  };
}

export function mergeSiteContent(stored?: {
  tagline?: string | null;
  description?: string | null;
  footerHeading?: string | null;
  footerDescription?: string | null;
  categoriesIntroTitle?: string | null;
  categoriesIntroDescription?: string | null;
  hero?: Partial<SiteHeroContent> | null;
} | null): SiteContent {
  const defaults = defaultSiteContent();
  const hero = stored?.hero;
  return {
    tagline: stored?.tagline?.trim() || defaults.tagline,
    description: stored?.description?.trim() || defaults.description,
    footerHeading: stored?.footerHeading?.trim() || defaults.footerHeading,
    footerDescription:
      stored?.footerDescription?.trim() || defaults.footerDescription,
    categoriesIntroTitle:
      stored?.categoriesIntroTitle?.trim() || defaults.categoriesIntroTitle,
    categoriesIntroDescription:
      stored?.categoriesIntroDescription?.trim() ||
      defaults.categoriesIntroDescription,
    hero: {
      eyebrow: hero?.eyebrow?.trim() || defaults.hero.eyebrow,
      headline: hero?.headline?.trim() || defaults.hero.headline,
      description: hero?.description?.trim() || defaults.hero.description,
      primaryCtaLabel:
        hero?.primaryCtaLabel?.trim() || defaults.hero.primaryCtaLabel,
      secondaryCtaLabel:
        hero?.secondaryCtaLabel?.trim() || defaults.hero.secondaryCtaLabel,
      videoUrl: hero?.videoUrl?.trim() || defaults.hero.videoUrl,
      posterUrl: hero?.posterUrl?.trim() || defaults.hero.posterUrl,
      webmUrl: hero?.webmUrl?.trim() || defaults.hero.webmUrl,
    },
  };
}
