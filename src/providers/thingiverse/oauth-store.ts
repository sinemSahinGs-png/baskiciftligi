import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env.server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import {
  decryptThingiverseOauthToken,
  encryptThingiverseOauthToken,
  sanitizeThingiverseToken,
} from "@/providers/thingiverse/auth";

const SETTINGS_KEY = "thingiverse.oauth.cipher";
const cacheTtlMs = 5 * 60 * 1000;

let memoryToken: { value: string | null; expiresAt: number } | null = null;

function encryptionSecret() {
  return (
    serverEnv.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY ||
    serverEnv.MANUFACTURING_QUOTE_HMAC_SECRET ||
    ""
  );
}

export function rememberThingiverseOauthToken(token: string) {
  const clean = sanitizeThingiverseToken(token);
  memoryToken = {
    value: clean ?? null,
    expiresAt: Date.now() + cacheTtlMs,
  };
}

export function peekThingiverseOauthToken() {
  if (memoryToken && memoryToken.expiresAt > Date.now()) {
    return memoryToken.value ?? undefined;
  }
  return undefined;
}

export function clearThingiverseOauthTokenCache() {
  memoryToken = null;
}

export async function hydrateThingiverseOauthToken(): Promise<string | undefined> {
  const peek = peekThingiverseOauthToken();
  if (peek) return peek;
  if (memoryToken && memoryToken.value === null && memoryToken.expiresAt > Date.now()) {
    return undefined;
  }

  const secret = encryptionSecret();
  const client = createServiceRoleSupabaseClient();
  if (!secret || !client) {
    memoryToken = { value: null, expiresAt: Date.now() + 30_000 };
    return undefined;
  }

  const { data, error } = await client
    .from("site_settings")
    .select("value, is_public")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (error || !data || data.is_public) {
    memoryToken = { value: null, expiresAt: Date.now() + cacheTtlMs };
    return undefined;
  }

  const payload = data.value as {
    v?: unknown;
    iv?: unknown;
    tag?: unknown;
    data?: unknown;
  };
  const token = decryptThingiverseOauthToken(payload, secret);
  memoryToken = {
    value: token ?? null,
    expiresAt: Date.now() + cacheTtlMs,
  };
  return token;
}

export async function saveThingiverseOauthToken(token: string) {
  const clean = sanitizeThingiverseToken(token);
  const secret = encryptionSecret();
  const client = createServiceRoleSupabaseClient();
  if (!clean) {
    throw new Error("Thingiverse jetonu boş.");
  }
  if (!secret) {
    throw new Error("OAuth jetonu şifrelenemedi.");
  }
  if (!client) {
    throw new Error("Jeton kaydı için veritabanı yok.");
  }

  const value = encryptThingiverseOauthToken(clean, secret);
  const { error } = await client.from("site_settings").upsert({
    key: SETTINGS_KEY,
    value,
    description: "Encrypted Thingiverse OAuth access token",
    is_public: false,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error("Thingiverse jetonu kaydedilemedi.");
  }
  rememberThingiverseOauthToken(clean);
}

export function signThingiverseOauthState(state: string) {
  const secret = encryptionSecret() || "tv-oauth-dev";
  return createHmac("sha256", secret).update(state).digest("base64url");
}

export function createThingiverseOauthState() {
  const state = randomBytes(24).toString("base64url");
  return `${state}.${signThingiverseOauthState(state)}`;
}

export function verifyThingiverseOauthState(raw?: string | null) {
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return false;
  const state = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  const expected = signThingiverseOauthState(state);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
