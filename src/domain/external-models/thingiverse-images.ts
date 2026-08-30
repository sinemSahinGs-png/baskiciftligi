export type ThingiverseImagePurpose = "card" | "detail" | "thumb";

export interface ThingiverseImageCandidate {
  id: string;
  url: string;
  displayUrl: string;
}

const ALLOWED_HOSTS = new Set([
  "cdn.thingiverse.com",
  "www.thingiverse.com",
  "thingiverse.com",
  "resize.thingiverse.com",
]);

const PLACEHOLDER_PATH_RE =
  /\/site\/img\/thingiverse_logo|thingiverse_logo\.png|\/img\/default\.png|placeholder/i;

/** Strip resize/size suffixes for identity comparison. */
export function thingiverseImageIdentity(url: string, imageId?: string | number | null) {
  if (imageId != null && String(imageId).trim()) {
    return `id:${String(imageId).trim()}`;
  }
  try {
    const parsed = new URL(url);
    let path = parsed.pathname.toLocaleLowerCase("en-US");
    path = path.replace(/\/thumb:[^/]+$/i, "");
    path = path.replace(
      /[-_]?(?:thumb|small|medium|large|preview|display_(?:thumb|small|medium|large|image))(?:\.[a-z0-9]+)?$/i,
      "",
    );
    path = path.replace(/[-_]\d{2,4}x\d{2,4}(?:\.[a-z0-9]+)?$/i, "");
    parsed.search = "";
    parsed.hash = "";
    return `url:${parsed.hostname.toLocaleLowerCase()}${path}`;
  } catch {
    return `raw:${url.trim().toLocaleLowerCase("en-US")}`;
  }
}

export function isThingiversePlaceholderImageUrl(url: string | null | undefined) {
  if (!url?.trim()) return true;
  const lower = url.trim().toLocaleLowerCase("en-US");
  if (PLACEHOLDER_PATH_RE.test(lower)) return true;
  if (lower.endsWith("/logo.png") || lower.includes("no-image")) return true;
  return false;
}

export function normalizeThingiverseImageUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  let candidate = raw.trim();
  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`;
  }
  if (candidate.startsWith("http://")) {
    candidate = `https://${candidate.slice("http://".length)}`;
  }
  if (!candidate.startsWith("https://")) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;
  const host = parsed.hostname.toLocaleLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;
  if (isThingiversePlaceholderImageUrl(parsed.toString())) return null;
  return parsed.toString();
}

/** Prefer smaller CDN variants when the URL encodes a known size token. */
export function selectThingiverseDisplayUrl(
  url: string,
  purpose: ThingiverseImagePurpose,
): string {
  if (purpose === "card") {
    return url
      .replace(/display_large/gi, "display_medium")
      .replace(/display_image/gi, "display_medium")
      .replace(/display_med/gi, "display_medium");
  }
  if (purpose === "thumb") {
    return url
      .replace(/display_large/gi, "display_thumb")
      .replace(/display_medium/gi, "display_thumb")
      .replace(/display_image/gi, "display_thumb");
  }
  if (purpose === "detail") {
    return url
      .replace(/display_thumb/gi, "display_large")
      .replace(/display_small/gi, "display_large");
  }
  return url;
}

export function hasUsableThingiverseThumbnail(
  thumbnailUrl: string | null | undefined,
) {
  return Boolean(normalizeThingiverseImageUrl(thumbnailUrl));
}

export function collectThingiverseGalleryCandidates(input: {
  thumbnailUrl?: string | null;
  imageUrls?: Array<string | null | undefined>;
  imageMeta?: Array<{ id?: number | string | null; url?: string | null }>;
}): ThingiverseImageCandidate[] {
  const ordered: Array<{ id?: number | string | null; url?: string | null }> = [];

  if (input.thumbnailUrl) {
    ordered.push({ url: input.thumbnailUrl });
  }
  for (const url of input.imageUrls ?? []) {
    if (url) ordered.push({ url });
  }
  for (const meta of input.imageMeta ?? []) {
    ordered.push(meta);
  }

  const seen = new Set<string>();
  const out: ThingiverseImageCandidate[] = [];

  for (const entry of ordered) {
    const normalized = normalizeThingiverseImageUrl(entry.url);
    if (!normalized) continue;
    const identity = thingiverseImageIdentity(normalized, entry.id);
    if (seen.has(identity)) continue;
    seen.add(identity);
    out.push({
      id: identity,
      url: normalized,
      displayUrl: selectThingiverseDisplayUrl(normalized, "detail"),
    });
  }

  return out;
}

export function cardImageFromCandidate(
  candidate: ThingiverseImageCandidate | null | undefined,
) {
  if (!candidate) return null;
  return selectThingiverseDisplayUrl(candidate.url, "card");
}

export function thumbImageFromCandidate(candidate: ThingiverseImageCandidate) {
  return selectThingiverseDisplayUrl(candidate.url, "thumb");
}
