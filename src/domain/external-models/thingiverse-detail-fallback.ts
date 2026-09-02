import { buildAttributionText } from "@/domain/manufacturing/licenses";
import { normalizeThingiverseImageUrl } from "@/domain/external-models/thingiverse-images";
import type { ExternalModelSummary } from "@/providers/contracts";

export const THINGIVERSE_DETAIL_NOTICE_TR =
  "Model ayrıntılarının bir bölümü şu anda yüklenemedi.";

const ID_RE = /^\d{1,12}$/;
const TITLE_MAX = 80;
const CREATOR_MAX = 40;
const IMAGE_QUERY_MAX = 220;

export interface ThingiverseDetailFallback {
  externalId: string;
  title: string;
  creatorName: string;
  thumbnailUrl: string | null;
}

export function isThingiverseNumericId(value: string): boolean {
  return ID_RE.test(value.trim());
}

export function canonicalThingiverseUrl(externalId: string): string {
  return `https://www.thingiverse.com/thing:${externalId.trim()}`;
}

function stripControls(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function sanitizeThingiverseTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = stripControls(value).slice(0, TITLE_MAX);
  return cleaned.length > 0 ? cleaned : null;
}

export function sanitizeThingiverseCreator(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = stripControls(value).slice(0, CREATOR_MAX);
  return cleaned.length > 0 ? cleaned : null;
}

export function sanitizeThingiverseQueryImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length > IMAGE_QUERY_MAX) return null;
  return normalizeThingiverseImageUrl(value);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Compact discovery handoff. Title and creator only; image is optional and
 * must already be an allowlisted Thingiverse CDN URL. Source URL is never
 * taken from the query string.
 */
export function parseThingiverseDetailFallback(input: {
  externalId: string;
  searchParams?: {
    t?: string | string[];
    c?: string | string[];
    img?: string | string[];
    sourceUrl?: string | string[];
    description?: string | string[];
  };
}): ThingiverseDetailFallback | null {
  const externalId = input.externalId.trim();
  if (!isThingiverseNumericId(externalId)) {
    return null;
  }
  const title =
    sanitizeThingiverseTitle(firstParam(input.searchParams?.t)) ??
    `Thingiverse modeli ${externalId}`;
  const creatorName =
    sanitizeThingiverseCreator(firstParam(input.searchParams?.c)) ??
    "Thingiverse tasarımcısı";
  const thumbnailUrl = sanitizeThingiverseQueryImage(
    firstParam(input.searchParams?.img),
  );
  void firstParam(input.searchParams?.sourceUrl);
  void firstParam(input.searchParams?.description);
  return {
    externalId,
    title,
    creatorName,
    thumbnailUrl,
  };
}

export function buildThingiverseDetailPath(input: {
  externalId: string;
  title?: string | null;
  creatorName?: string | null;
  thumbnailUrl?: string | null;
}): string {
  const externalId = input.externalId.trim();
  if (!isThingiverseNumericId(externalId)) {
    return "/hazir-modeller";
  }
  const params = new URLSearchParams();
  const title = sanitizeThingiverseTitle(input.title);
  const creator = sanitizeThingiverseCreator(input.creatorName);
  if (title) params.set("t", title);
  if (creator) params.set("c", creator);
  const image = sanitizeThingiverseQueryImage(input.thumbnailUrl);
  if (image) params.set("img", image);
  const query = params.toString();
  return query
    ? `/hazir-modeller/thingiverse/${externalId}?${query}`
    : `/hazir-modeller/thingiverse/${externalId}`;
}

export function thingiverseSummaryFromFallback(
  fallback: ThingiverseDetailFallback,
): ExternalModelSummary {
  const sourceUrl = canonicalThingiverseUrl(fallback.externalId);
  return {
    source: "thingiverse",
    externalId: fallback.externalId,
    title: fallback.title,
    creatorName: fallback.creatorName,
    sourceUrl,
    thumbnailUrl: fallback.thumbnailUrl ?? undefined,
    attributionText: buildAttributionText({
      title: fallback.title,
      creator: fallback.creatorName,
      licenseName: "Thingiverse",
      sourceUrl,
    }),
    permissionStatus: "discovery_only",
    isPurchasable: false,
    pricingAllowed: false,
    automaticManufacturingAllowed: false,
  };
}
