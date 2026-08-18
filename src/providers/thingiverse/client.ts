import "server-only";

import { serverEnv } from "@/lib/env.server";
import type { ThingiverseThing } from "@/providers/thingiverse/types";

const defaultBase = "https://api.thingiverse.com";
const cacheTtlMs = 8 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; payload: unknown }>();

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
  return Boolean(accessToken());
}

export function invalidateThingiverseCache() {
  cache.clear();
}

async function thingiverseFetch<T>(path: string): Promise<T> {
  const token = accessToken();
  if (!token) {
    throw new ThingiverseApiError(401, "Thingiverse jetonu yok.");
  }

  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload as T;
  }

  const url = new URL(path, apiBase());
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    throw new ThingiverseApiError(response.status, "Thingiverse kimliği reddedildi.");
  }
  if (response.status === 429) {
    throw new ThingiverseApiError(429, "Thingiverse hız sınırı.");
  }
  if (!response.ok) {
    throw new ThingiverseApiError(
      response.status,
      `Thingiverse yanıtı ${response.status}.`,
    );
  }

  const payload = (await response.json()) as T;
  cache.set(path, { expiresAt: Date.now() + cacheTtlMs, payload });
  return payload;
}

export async function listPopularThings(page: number) {
  const safePage = Math.max(1, Math.trunc(page));
  return thingiverseFetch<ThingiverseThing[]>(`/popular?page=${safePage}`);
}

export async function searchThings(query: string, page: number) {
  const safePage = Math.max(1, Math.trunc(page));
  const term = encodeURIComponent(query.trim());
  return thingiverseFetch<ThingiverseThing[]>(`/search/${term}?page=${safePage}`);
}

export async function getThing(id: string) {
  return thingiverseFetch<ThingiverseThing>(`/things/${encodeURIComponent(id)}`);
}

export async function getThingImages(id: string) {
  return thingiverseFetch<Array<{ url?: string }>>(
    `/things/${encodeURIComponent(id)}/images`,
  );
}
