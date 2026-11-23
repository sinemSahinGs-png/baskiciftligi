import { AtelierCave } from "@/components/home-industrial/atelier-cave";
import { CompactFaq } from "@/components/home-industrial/compact-faq";
import { HomeCategories } from "@/components/home-industrial/home-categories";
import { HomeTrust } from "@/components/home-industrial/home-trust";
import { IdeaCommand } from "@/components/home-industrial/idea-command";
import { IndustrialHeaderEffects } from "@/components/home-industrial/industrial-header";
import { OctoJourneyPath } from "@/components/home-industrial/octo-journey-path";
import { OctoProducts } from "@/components/home-industrial/octo-products";
import { OctoUniverse } from "@/components/home-industrial/octo-universe";
import { ProductionStory } from "@/components/home-industrial/production-story";
import { SandAbyssHandoff } from "@/components/home-industrial/sand-abyss-handoff";
import { ScrollThemeProvider } from "@/components/home-industrial/scroll-theme-provider";
import { StartPath } from "@/components/home-industrial/start-path";
import { WholesaleBand } from "@/components/home-industrial/wholesale-band";
import type { ReadyModelCard } from "@/components/home/ready-models-section";
import type { Material, Product } from "@/domain/catalog/types";

import "./home-industrial.css";
import "./home-story.css";
import "./atelier-story.css";
import "./home-premium.css";

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
    <div className="hi-root octo-world octo-premium">
      <IndustrialHeaderEffects />
      <ScrollThemeProvider />
      <IdeaCommand />
      <SandAbyssHandoff />
      <OctoJourneyPath />
      <StartPath />
      <AtelierCave>
        <ProductionStory />
        <HomeCategories products={products} />
        <OctoUniverse />
      </AtelierCave>
      <OctoProducts products={products} />
      <WholesaleBand />
      <HomeTrust />
      <CompactFaq />
    </div>
  );
}
