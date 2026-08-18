import { describe, expect, it } from "vitest";

import { PRODUCTION_SITE_URL, siteConfig } from "@/config/site";

describe("siteConfig brand", () => {
  it("uses Baskı Çiftliği as the customer-facing name", () => {
    expect(siteConfig.name).toBe("Baskı Çiftliği");
    expect(siteConfig.shortName).toBe("Baskı Çiftliği");
    expect(siteConfig.legalName).toBe("Baskı Çiftliği");
    expect(siteConfig.wordmark).toBe("Baskı Çiftliği");
    expect(siteConfig.asciiId).toBe("baskiciftligi");
    expect(siteConfig.collectionLabel).toBe("Baskı Çiftliği Koleksiyonu");
    expect(siteConfig.bylineLabel).toBe("Baskı Çiftliği tarafından");
  });

  it("does not keep the temporary SOMUT brand in visible copy", () => {
    const visible = [
      siteConfig.name,
      siteConfig.shortName,
      siteConfig.legalName,
      siteConfig.wordmark,
      siteConfig.tagline,
      siteConfig.description,
      siteConfig.collectionLabel,
      siteConfig.bylineLabel,
      siteConfig.studioLabel,
      siteConfig.footerHeading,
      siteConfig.footerDescription,
      siteConfig.hero.eyebrow,
      siteConfig.hero.headline,
      siteConfig.hero.description,
      siteConfig.hero.primaryCtaLabel,
      siteConfig.hero.secondaryCtaLabel,
    ].join(" ");

    expect(visible).not.toMatch(/somut/i);
    expect(siteConfig.tagline).toBe(
      "Modelini seç, dosyanı yükle; biz üretelim.",
    );
    expect(siteConfig.hero.headline).toBe("Fikrini yükle. Biz üretelim.");
  });

  it("canonical production URL is the apex Baskı Çiftliği domain", () => {
    expect(PRODUCTION_SITE_URL).toBe("https://baskiciftligi.com");
    expect(new URL(PRODUCTION_SITE_URL).hostname).toBe("baskiciftligi.com");
    expect(PRODUCTION_SITE_URL).not.toMatch(/localhost|vercel\.app|octostudio|somut/i);
  });
});
