import { normalizeTurkish } from "@/lib/search/turkish-match";

export type CuratedPlatform =
  | "printables"
  | "thingiverse"
  | "myminifactory"
  | "other"
  | "studio";

export type CuratedListingKind = "studio" | "curated_external";

export type CuratedPublicationStatus = "draft" | "published" | "archived";

export interface CuratedModelRecord {
  id: string;
  sourceSlug: string;
  externalId: string;
  slug: string;
  title: string;
  titleTr: string;
  originalTitle: string | null;
  description: string | null;
  searchTerms: string[];
  categoryId: string | null;
  categoryLabel: string | null;
  platformType: CuratedPlatform;
  listingKind: CuratedListingKind;
  sourceUrl: string;
  previewImageUrl: string | null;
  imageAlt: string | null;
  downloadUrl: string | null;
  authorName: string | null;
  authorUrl: string | null;
  licenseCode: string | null;
  licenseVerified: boolean;
  attributionText: string | null;
  status: CuratedPublicationStatus;
  permissionKind: "owned" | "licensed" | "permission_review";
  publishedAt: string | null;
  createdBy: string | null;
  updatedAt: string;
}

export interface CuratedModelInput {
  id?: string;
  titleTr: string;
  originalTitle?: string | null;
  slug: string;
  description?: string | null;
  searchTerms?: string[];
  categoryId?: string | null;
  categoryLabel?: string | null;
  platformType: CuratedPlatform;
  listingKind?: CuratedListingKind;
  sourceUrl: string;
  previewImageUrl?: string | null;
  imageAlt?: string | null;
  downloadUrl?: string | null;
  authorName?: string | null;
  licenseCode?: string | null;
  licenseVerified?: boolean;
  attributionText?: string | null;
  status?: CuratedPublicationStatus;
  permissionKind?: CuratedModelRecord["permissionKind"];
  createdBy?: string | null;
}

const PLATFORM_HOSTS: Record<Exclude<CuratedPlatform, "other" | "studio">, string[]> = {
  printables: ["www.printables.com", "printables.com"],
  thingiverse: ["www.thingiverse.com", "thingiverse.com"],
  myminifactory: ["www.myminifactory.com", "myminifactory.com"],
};

export function platformLabel(platform: CuratedPlatform) {
  switch (platform) {
    case "printables":
      return "Printables";
    case "thingiverse":
      return "Thingiverse";
    case "myminifactory":
      return "MyMiniFactory";
    case "studio":
      return "Baskı Çiftliği";
    default:
      return "Diğer";
  }
}

export function sanitizeSearchTerms(raw: string[] | string | undefined) {
  const list = Array.isArray(raw)
    ? raw
    : String(raw ?? "")
        .split(/[,;\n]/)
        .map((item) => item.trim());
  return [...new Set(list.map((item) => item.trim()).filter(Boolean))].slice(0, 24);
}

export function slugifyCuratedTitle(input: string) {
  return normalizeTurkish(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateCuratedSourceUrl(
  rawUrl: string,
  platform: CuratedPlatform,
): { ok: true; canonicalUrl: string } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Geçersiz kaynak URL." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, error: "Kaynak URL yalnızca https olabilir." };
  }
  if (url.username || url.password) {
    return { ok: false, error: "URL içinde kimlik bilgisi olamaz." };
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)
  ) {
    return { ok: false, error: "Özel ağ adresleri kabul edilmez." };
  }

  if (platform !== "other" && platform !== "studio") {
    const allowed = PLATFORM_HOSTS[platform];
    if (!allowed.includes(host)) {
      return {
        ok: false,
        error: `${platformLabel(platform)} için izin verilen host: ${allowed.join(", ")}`,
      };
    }
  }

  url.hash = "";
  url.search = "";
  return { ok: true, canonicalUrl: url.toString().replace(/\/$/, "") || url.origin };
}

export function assertCuratedPublishReady(input: CuratedModelInput) {
  const missing: string[] = [];
  if (!input.titleTr.trim()) missing.push("Türkçe başlık");
  if (!input.previewImageUrl?.trim()) missing.push("Kapak görseli");
  if (!input.imageAlt?.trim()) missing.push("Görsel alt metni");
  if (!input.categoryId && !input.categoryLabel?.trim()) missing.push("Kategori");
  if (!input.sourceUrl.trim()) missing.push("Kaynak URL");
  if (sanitizeSearchTerms(input.searchTerms).length === 0) missing.push("Arama etiketleri");
  const urlCheck = validateCuratedSourceUrl(input.sourceUrl, input.platformType);
  if (!urlCheck.ok) missing.push(urlCheck.error);
  return missing;
}
