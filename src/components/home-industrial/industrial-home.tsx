import { AtelierCave } from "@/components/home-industrial/atelier-cave";
import { AtelierScrollMotion } from "@/components/home-industrial/atelier-scroll";
import { CompactClose } from "@/components/home-industrial/compact-close";
import { CompactUpload } from "@/components/home-industrial/compact-upload";
import { CuratedCollection } from "@/components/home-industrial/curated-collection";
import { HomeCategories } from "@/components/home-industrial/home-categories";
import { IdeaCommand } from "@/components/home-industrial/idea-command";
import { IndustrialHeaderEffects } from "@/components/home-industrial/industrial-header";
import { MobileStickyCta } from "@/components/home-industrial/mobile-sticky-cta";
import { ProductionJourney } from "@/components/home-industrial/production-journey";
import { ScrollThemeProvider } from "@/components/home-industrial/scroll-theme-provider";
import { StudioIntro } from "@/components/home-industrial/studio-intro";
import { TechnicalGrid } from "@/components/home-industrial/technical-grid";
import { WholesaleBand } from "@/components/home-industrial/wholesale-band";
import { OceanAtmosphere } from "@/components/brand/ocean-atmosphere";
import { OceanDepthTracker } from "@/components/brand/ocean-depth-tracker";
import type { ReadyModelCard } from "@/components/home/ready-models-section";
import type { Material, Product } from "@/domain/catalog/types";

import "./home-industrial.css";
import "./home-story.css";
import "./atelier-story.css";

export function IndustrialHome({
  products,
  materials,
  readyModels,
}: {
  products: Product[];
  materials: Material[];
  readyModels: ReadyModelCard[];
}) {
  void materials;
  void readyModels;

  return (
    <div className="hi-root octo-world atelier-world">
      <IndustrialHeaderEffects />
      <ScrollThemeProvider />
      <AtelierScrollMotion />
      <OceanDepthTracker />
      <OceanAtmosphere />
      <TechnicalGrid />
      <IdeaCommand />
      <AtelierCave>
        <StudioIntro />
        <ProductionJourney />
        <HomeCategories products={products} />
        <CuratedCollection products={products} />
        <CompactUpload />
        <WholesaleBand />
        <CompactClose />
      </AtelierCave>
      <MobileStickyCta />
    </div>
  );
}
