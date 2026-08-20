import type { CuratedCatalogCardData } from "@/components/models/curated-catalog-card";
import type { ThingiverseLibraryCardData } from "@/components/models/thingiverse-library-card";

/** Single normalized discovery pool for /hazir-modeller */
export type OwnedModelResult = {
  kind: "curated";
  listingKind: "studio";
} & CuratedCatalogCardData;

export type CuratedModelResult = {
  kind: "curated";
  listingKind: "curated_external" | "studio";
} & CuratedCatalogCardData;

export type ThingiverseModelResult = {
  kind: "thingiverse";
} & ThingiverseLibraryCardData;

export type UnifiedDiscoveryResult =
  | ({ kind: "curated" } & CuratedCatalogCardData)
  | ThingiverseModelResult;

export type UnifiedSearchPayload = {
  models: UnifiedDiscoveryResult[];
  page?: number;
  hasMore?: boolean;
  softError?: string;
  categories?: string[];
  thingiverseConnected?: boolean;
  thingiverseStatus?: string;
};
