import type { ThingiverseFile, ThingiverseThing } from "@/providers/thingiverse/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapList(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

export function coerceThingiverseString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

export function coerceThingiverseTags(
  value: unknown,
): Array<string | { name?: string | null }> {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value as Array<string | { name?: string | null }>;
  }
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }
  if (isRecord(value)) {
    return [value as { name?: string | null }];
  }
  return [];
}

function normalizeCreator(raw: unknown): ThingiverseThing["creator"] {
  if (!isRecord(raw)) {
    return undefined;
  }
  return {
    id: typeof raw.id === "number" ? raw.id : undefined,
    name: coerceThingiverseString(raw.name),
    first_name: coerceThingiverseString(raw.first_name),
    last_name: coerceThingiverseString(raw.last_name),
  };
}

function normalizeDefaultImage(raw: unknown): ThingiverseThing["default_image"] {
  if (typeof raw === "string") {
    return { url: raw };
  }
  if (!isRecord(raw)) {
    return undefined;
  }
  return { url: coerceThingiverseString(raw.url) };
}

function normalizeThingShape(raw: Record<string, unknown>): ThingiverseThing {
  const licenseRaw = raw.license;
  let license: string | undefined;
  if (typeof licenseRaw === "string") {
    license = licenseRaw.trim() || undefined;
  } else if (isRecord(licenseRaw)) {
    license = coerceThingiverseString(licenseRaw.name ?? licenseRaw.label);
  }

  return {
    id: typeof raw.id === "number" ? raw.id : Number(raw.id) || undefined,
    name: coerceThingiverseString(raw.name),
    public_url: coerceThingiverseString(raw.public_url),
    url: coerceThingiverseString(raw.url),
    thumbnail: coerceThingiverseString(raw.thumbnail),
    default_image: normalizeDefaultImage(raw.default_image),
    creator: normalizeCreator(raw.creator),
    license,
    license_url: coerceThingiverseString(raw.license_url),
    description: coerceThingiverseString(raw.description),
    like_count: typeof raw.like_count === "number" ? raw.like_count : undefined,
    collect_count:
      typeof raw.collect_count === "number" ? raw.collect_count : undefined,
    is_private: Boolean(raw.is_private),
    is_nsfw: Boolean(raw.is_nsfw),
    file_count: typeof raw.file_count === "number" ? raw.file_count : undefined,
    files_url: coerceThingiverseString(raw.files_url),
    tags: coerceThingiverseTags(raw.tags) as ThingiverseThing["tags"],
    categories: coerceThingiverseTags(raw.categories) as ThingiverseThing["categories"],
  };
}

/** Single-thing GET may return the record directly or wrapped. */
export function normalizeThingDetail(payload: unknown): ThingiverseThing {
  if (isRecord(payload)) {
    if ("id" in payload || "name" in payload || "public_url" in payload) {
      return normalizeThingShape(payload);
    }
    for (const key of ["thing", "object", "result", "data"]) {
      const nested = payload[key];
      if (isRecord(nested)) {
        return normalizeThingShape(nested);
      }
    }
  }
  throw new Error("Thingiverse model biçimi beklenmeyen.");
}

/** Images endpoint returns an array OR a single image object. */
export function normalizeThingImages(
  payload: unknown,
): Array<{ id?: number; url?: string }> {
  const list = unwrapList(payload, ["images", "hits", "objects", "results"]);
  if (list.length > 0) {
    return list.map((item) => {
      if (typeof item === "string") {
        return { url: item };
      }
      if (!isRecord(item)) {
        return {};
      }
      return {
        id: typeof item.id === "number" ? item.id : Number(item.id) || undefined,
        url: coerceThingiverseString(item.url ?? item.public_url ?? item.thumbnail),
      };
    });
  }
  if (isRecord(payload) && ("url" in payload || "id" in payload || "public_url" in payload)) {
    return [
      {
        id:
          typeof payload.id === "number"
            ? payload.id
            : Number(payload.id) || undefined,
        url: coerceThingiverseString(
          payload.url ?? payload.public_url ?? payload.thumbnail,
        ),
      },
    ];
  }
  return [];
}

function normalizeFileShape(raw: unknown): ThingiverseFile | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id =
    typeof raw.id === "number"
      ? raw.id
      : Number(raw.id) || undefined;
  const name = coerceThingiverseString(raw.name);
  if (!id && !name) {
    return null;
  }
  return {
    id,
    name,
    size: typeof raw.size === "number" ? raw.size : undefined,
    url: coerceThingiverseString(raw.url),
    public_url: coerceThingiverseString(raw.public_url),
    download_url: coerceThingiverseString(raw.download_url),
    direct_url: coerceThingiverseString(raw.direct_url),
    thumbnail: coerceThingiverseString(raw.thumbnail),
    formatted_size: coerceThingiverseString(raw.formatted_size),
    date: coerceThingiverseString(raw.date),
  };
}

/** Files endpoint may return an array or a single file object. */
export function normalizeThingFiles(payload: unknown): ThingiverseFile[] {
  const list = unwrapList(payload, ["files", "hits", "objects", "results"]);
  const candidates = list.length > 0 ? list : isRecord(payload) ? [payload] : [];
  const out: ThingiverseFile[] = [];
  for (const item of candidates) {
    const file = normalizeFileShape(item);
    if (file) {
      out.push(file);
    }
  }
  return out;
}
