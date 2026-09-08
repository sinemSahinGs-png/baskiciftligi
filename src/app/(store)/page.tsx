import type { Metadata } from "next";

import { IndustrialHome } from "@/components/home-industrial/industrial-home";
import { faqItems } from "@/components/home/faq-data";
import { siteConfig } from "@/config/site";
import {
  listMaterials,
  listProducts,
} from "@/domain/catalog/repository";
import { listPublishedCuratedModels } from "@/domain/curated-models/repository";
import { platformLabel } from "@/domain/curated-models/types";
import { homepagePrintLibrary } from "@/domain/home/homepage";

export const metadata: Metadata = {
  title: siteConfig.tagline,
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: "/",
  },
};

export default async function HomePage() {
  const [products, materials, curatedModels] = await Promise.all([
    listProducts(),
    listMaterials(),
    listPublishedCuratedModels(4, "curated_external"),
  ]);

  const readyFallback =
    curatedModels.length > 0
      ? curatedModels.map((model) => ({
          id: model.id,
          name: model.titleTr,
          category: model.categoryLabel ?? "Küratörlü",
          imageUrl: model.previewImageUrl,
          href: `/hazir-modeller/katalog/${model.slug}`,
          source: "curated" as const,
          sourceLabel: platformLabel(model.platformType),
          licenseLabel: model.licenseCode,
          licenseVerified: model.licenseVerified,
          fileVerified: Boolean(model.downloadUrl),
          quoteEligible: model.permissionKind === "owned" && Boolean(model.downloadUrl),
        }))
      : homepagePrintLibrary.map((model) => ({
          id: model.id,
          name: model.name,
          category: model.category,
          imageUrl: model.imageUrl,
          href: model.href,
          source: "fallback" as const,
          sourceLabel: "Stüdyo vitrini",
          licenseLabel: model.licenseLabel,
          licenseVerified: model.licenseStatus === "owned",
          fileVerified: false,
          quoteEligible: false,
        }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main id="ana-icerik">
      <IndustrialHome
        products={products}
        materials={materials}
        readyModels={readyFallback}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
