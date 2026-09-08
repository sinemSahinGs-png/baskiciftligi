import { CompactFaq } from "@/components/home-industrial/compact-faq";
import { CorporateProduction } from "@/components/home-industrial/corporate-production";
import { FeaturedProduct } from "@/components/home-industrial/featured-product";
import { FinalCta } from "@/components/home-industrial/final-cta";
import { HomeCategories } from "@/components/home-industrial/home-categories";
import { IdeaCommand } from "@/components/home-industrial/idea-command";
import { IndustrialHeaderEffects } from "@/components/home-industrial/industrial-header";
import { MaterialsStrip } from "@/components/home-industrial/materials-strip";
import { MobileStickyCta } from "@/components/home-industrial/mobile-sticky-cta";
import { AutoQuote } from "@/components/home-industrial/auto-quote";
import { ProductionPaths } from "@/components/home-industrial/production-paths";
import { ProductionProcess } from "@/components/home-industrial/production-process";
import { RealProducts } from "@/components/home-industrial/real-products";
import { ScrollThemeProvider } from "@/components/home-industrial/scroll-theme-provider";
import { TechnicalGrid } from "@/components/home-industrial/technical-grid";
import { TrustStrip } from "@/components/home-industrial/trust-strip";
import { WholesaleBand } from "@/components/home-industrial/wholesale-band";
import type { ReadyModelCard } from "@/components/home/ready-models-section";
import type { Material, Product } from "@/domain/catalog/types";

import "./home-industrial.css";

export function IndustrialHome({
  products,
  materials,
  readyModels,
}: {
  products: Product[];
  materials: Material[];
  readyModels: ReadyModelCard[];
}) {
  const featured =
    products.find((product) => product.featured) ?? products[0] ?? null;
  void readyModels;

  return (
    <div className="hi-root pb-3 md:pb-0">
      <IndustrialHeaderEffects />
      <ScrollThemeProvider />
      <TechnicalGrid />
      <IdeaCommand />
      <ProductionPaths />
      <HomeCategories products={products} />
      <AutoQuote />
      <RealProducts products={products} />
      <FeaturedProduct product={featured} />
      <ProductionProcess />
      <MaterialsStrip materials={materials} />
      <WholesaleBand />
      <CorporateProduction />
      <TrustStrip />
      <CompactFaq />
      <FinalCta />
      <MobileStickyCta />
    </div>
  );
}
