import { CompactFaq } from "@/components/home-industrial/compact-faq";
import { HomeCategories } from "@/components/home-industrial/home-categories";
import { HomeTrust } from "@/components/home-industrial/home-trust";
import { IdeaCommand } from "@/components/home-industrial/idea-command";
import { IndustrialHeaderEffects } from "@/components/home-industrial/industrial-header";
import { OctoCaveAtmosphere } from "@/components/home-industrial/octo-cave-atmosphere";
import { OctoDepthHud } from "@/components/home-industrial/octo-depth-hud";
import { OctoJourneyPath } from "@/components/home-industrial/octo-journey-path";
import { OctoProducts } from "@/components/home-industrial/octo-products";
import { OctoSandDissolve } from "@/components/home-industrial/octo-sand-dissolve";
import { OctoUniverse } from "@/components/home-industrial/octo-universe";
import { ProductionStory } from "@/components/home-industrial/production-story";
import { ScrollThemeProvider } from "@/components/home-industrial/scroll-theme-provider";
import { StartPath } from "@/components/home-industrial/start-path";
import { WholesaleBand } from "@/components/home-industrial/wholesale-band";
import type { ReadyModelCard } from "@/components/home/ready-models-section";
import type { Material, Product } from "@/domain/catalog/types";

import "./home-industrial.css";
import "./home-story.css";
import "./atelier-story.css";
import "./home-premium.css";
import "./octo-descent.css";

export function IndustrialHome({
  products,
  materials,
  readyModels,
  catalogStatus,
}: {
  products: Product[];
  materials: Material[];
  readyModels: ReadyModelCard[];
  catalogStatus: "populated" | "empty-preview" | "empty";
}) {
  void materials;
  void readyModels;

  return (
    <div className="hi-root octo-world octo-premium">
      <IndustrialHeaderEffects />
      <ScrollThemeProvider />
      <IdeaCommand />
      <OctoSandDissolve />
      <div className="octo-below-hero">
        <span id="atolye" className="octo-hash-anchor" />
        <OctoCaveAtmosphere />
        <OctoJourneyPath />
        <OctoDepthHud />
        <StartPath />
        <ProductionStory />
        <HomeCategories products={products} />
        <OctoUniverse />
        <OctoProducts products={products} catalogStatus={catalogStatus} />
        <WholesaleBand />
        <HomeTrust />
        <CompactFaq />
      </div>
    </div>
  );
}
