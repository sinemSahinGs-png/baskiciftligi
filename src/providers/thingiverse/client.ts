import "server-only";

import { parseStrictEnvBoolean } from "@/lib/env-boolean";
import { serverEnv } from "@/lib/env.server";
import { touchIntegration } from "@/domain/manufacturing/repository";
import { assertSafeThingiverseUrl, SsrfError } from "@/lib/manufacturing/ssrf";
import type { ThingiverseThing } from "@/providers/thingiverse/types";
import {
  normalizeThingDetail,
  normalizeThingFiles,
  normalizeThingImages,
} from "@/providers/thingiverse/normalize-detail";
import { normalizeThingList as normalizeThingListShape } from "@/providers/thingiverse/normalize-list";

const defaultBase = "https://api.thingiverse.com";
const cacheTtlMs = 8 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; payload: unknown }>();
const downloadTimeoutMs = 30_000;
const jsonTimeoutMs = 15_000;
const maxDownloadBytes = 100 * 1024 * 1024;

export class ThingiverseApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ThingiverseApiError";
  }
}

function apiBase() {
  return serverEnv.THINGIVERSE_API_BASE_URL ?? defaultBase;
}

function accessToken() {
  return serverEnv.THINGIVERSE_ACCESS_TOKEN;
}

export function canCallThingiverse() {
  return Boolean(accessToken()) || thingiverseFixtureMode();
}

export function thingiverseFixtureMode() {
  return (
    parseStrictEnvBoolean(serverEnv.THINGIVERSE_FIXTURE_MODE) &&
    process.env.NODE_ENV !== "production"
  );
}

export function invalidateThingiverseCache() {
  cache.clear();
}

async function recordSuccess() {
  try {
    await touchIntegration({
      thingiverseLastSuccessAt: new Date().toISOString(),
      thingiverseLastError: null,
    });
  } catch {
    return;
  }
}

async function recordFailure(status: number, message: string) {
  try {
    await touchIntegration({
      thingiverseLastFailureAt: new Date().toISOString(),
      thingiverseLastError: message,
      thingiverseRateLimitedUntil:
        status === 429
          ? new Date(Date.now() + 60_000).toISOString()
          : undefined,
    });
  } catch {
    return;
  }
}

async function thingiverseFetch<T>(path: string): Promise<T> {
  if (thingiverseFixtureMode()) {
    try {
      const { loadThingiverseFixture } = await import(
        "@/providers/thingiverse/fixtures"
      );
      return await loadThingiverseFixture<T>(path);
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? Number((error as { status: unknown }).status)
          : 502;
      const message =
        error instanceof Error ? error.message : "Thingiverse yanıt vermedi.";
      throw new ThingiverseApiError(
        Number.isFinite(status) && status > 0 ? status : 502,
        message,
      );
    }
  }

  const token = accessToken();
  if (!token) {
    throw new ThingiverseApiError(401, "Thingiverse jetonu yok.");
  }

  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload as T;
  }

  const url = new URL(path, apiBase());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), jsonTimeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
      redirect: "error",
    });
  } catch (error) {
    await recordFailure(504, "Thingiverse zaman aşımı.");
    if (error instanceof Error && error.name === "AbortError") {
      throw new ThingiverseApiError(504, "Thingiverse zaman aşımı.");
    }
    throw new ThingiverseApiError(503, "Thingiverse yanıt vermedi.");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    await recordFailure(response.status, "Thingiverse kimliği reddedildi.");
    throw new ThingiverseApiError(response.status, "Thingiverse kimliği reddedildi.");
  }
  if (response.status === 404) {
    throw new ThingiverseApiError(404, "Thingiverse kaydı yok veya kaldırılmış.");
  }
  if (response.status === 429) {
    await recordFailure(429, "Thingiverse hız sınırı.");
    throw new ThingiverseApiError(429, "Thingiverse hız sınırı.");
  }
  if (!response.ok) {
    await recordFailure(response.status, `Thingiverse yanıtı ${response.status}.`);
    throw new ThingiverseApiError(
      response.status,
      `Thingiverse yanıtı ${response.status}.`,
    );
  }

  const payload = (await response.json()) as T;
  cache.set(path, { expiresAt: Date.now() + cacheTtlMs, payload });
  await recordSuccess();
  return payload;
}

export function normalizeThingList(payload: unknown): ThingiverseThing[] {
  try {
    return normalizeThingListShape(payload);
  } catch (error) {
    throw new ThingiverseApiError(
      502,
      error instanceof Error ? error.message : "Thingiverse liste biçimi beklenmeyen.",
    );
  }
}

export async function listPopularThings(page: number) {
  const safePage = Math.max(1, Math.trunc(page));
  const payload = await thingiverseFetch<unknown>(`/popular?page=${safePage}`);
  return normalizeThingList(payload);
}

export async function searchThings(query: string, page: number) {
  const safePage = Math.max(1, Math.trunc(page));
  const term = encodeURIComponent(query.trim());
  const payload = await thingiverseFetch<unknown>(
    `/search/${term}?page=${safePage}`,
  );
  return normalizeThingList(payload);
}

export async function getThing(id: string) {
  const payload = await thingiverseFetch<unknown>(
    `/things/${encodeURIComponent(id)}`,
  );
  try {
    return normalizeThingDetail(payload);
  } catch (error) {
    throw new ThingiverseApiError(
      502,
      error instanceof Error ? error.message : "Thingiverse model biçimi beklenmeyen.",
    );
  }
}

export async function getThingImages(id: string) {
  const payload = await thingiverseFetch<unknown>(
    `/things/${encodeURIComponent(id)}/images`,
  );
  return normalizeThingImages(payload);
}

export async function getThingFiles(id: string) {
  const payload = await thingiverseFetch<unknown>(
    `/things/${encodeURIComponent(id)}/files`,
  );
  return normalizeThingFiles(payload);
}

export async function getCreator(username: string) {
  return thingiverseFetch<{ name?: string; public_url?: string; thumbnail?: string }>(
    `/users/${encodeURIComponent(username)}`,
  );
}

export async function downloadThingiverseFile(input: {
  downloadUrl: string;
  maxBytes?: number;
}): Promise<{ bytes: Uint8Array; contentType: string | null; finalUrl: string }> {
  if (thingiverseFixtureMode()) {
    const { loadThingiverseFileFixture } = await import(
      "@/providers/thingiverse/fixtures"
    );
    return loadThingiverseFileFixture(input.downloadUrl);
  }

  const token = accessToken();
  if (!token) {
    throw new ThingiverseApiError(401, "Thingiverse jetonu yok.");
  }

  let current = assertSafeThingiverseUrl(input.downloadUrl);
  const limit = input.maxBytes ?? maxDownloadBytes;
  const hops: string[] = [];

  for (let hop = 0; hop < 4; hop += 1) {
    hops.push(current.toString());
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), downloadTimeoutMs);
    let response: Response;
    try {
      response = await fetch(current, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      throw new ThingiverseApiError(504, "Thingiverse dosya indirme zaman aşımı.");
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new ThingiverseApiError(502, "Yönlendirme adresi yok.");
      }
      const next = new URL(location, current);
      try {
        current = assertSafeThingiverseUrl(next.toString());
      } catch (error) {
        if (error instanceof SsrfError) {
          throw new ThingiverseApiError(502, "Onaysız indirme yönlendirmesi.");
        }
        throw error;
      }
      continue;
    }

    if (!response.ok) {
      throw new ThingiverseApiError(
        response.status,
        `Thingiverse dosyası ${response.status}.`,
      );
    }

    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > limit) {
      throw new ThingiverseApiError(413, "Thingiverse dosyası çok büyük.");
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (!response.body) {
      const buffer = new Uint8Array(await response.arrayBuffer());
      if (buffer.byteLength > limit) {
        throw new ThingiverseApiError(413, "Thingiverse dosyası çok büyük.");
      }
      return {
        bytes: buffer,
        contentType: response.headers.get("content-type"),
        finalUrl: current.toString(),
      };
    }
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new ThingiverseApiError(413, "Thingiverse dosyası çok büyük.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return {
      bytes,
      contentType: response.headers.get("content-type"),
      finalUrl: current.toString(),
    };
  }

  throw new ThingiverseApiError(502, "İndirme yönlendirme döngüsü.");
}

export { apiBase };
