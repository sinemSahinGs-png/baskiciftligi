import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { forceLocalPersistence, isDevelopmentDemoMode, isSupabaseConfigured } from "@/lib/env";
import { serverEnv, supabaseSecretKey } from "@/lib/env.server";
import {
  MANUFACTURING_MAX_UPLOAD_BYTES,
} from "@/domain/manufacturing/types";

export function manufacturingDataRoot() {
  const override = process.env.MANUFACTURING_DATA_ROOT?.trim();
  if (override) {
    return path.resolve(override);
  }
  return path.join(process.cwd(), ".octo-data", "manufacturing");
}

export function manufacturingStoreFile() {
  return path.join(manufacturingDataRoot(), "store.json");
}

export function manufacturingObjectPath(storageKey: string) {
  const root = path.resolve(manufacturingDataRoot(), "objects");
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("Depolama anahtarı geçersiz.");
  }
  return resolved;
}

export function manufacturingUsesLocalPersistence() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (forceLocalPersistence) {
    return true;
  }
  return isDevelopmentDemoMode || !isSupabaseConfigured;
}

export function manufacturingPersistenceReady() {
  if (manufacturingUsesLocalPersistence()) {
    return true;
  }
  return isSupabaseConfigured && Boolean(supabaseSecretKey);
}

export function maxUploadBytes() {
  const configured = Number(process.env.MANUFACTURING_MAX_UPLOAD_BYTES);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.min(configured, MANUFACTURING_MAX_UPLOAD_BYTES);
  }
  return MANUFACTURING_MAX_UPLOAD_BYTES;
}

export function developmentHmacSecret() {
  return "dev-manufacturing-hmac-not-for-production";
}

export function developmentWorkerSecret() {
  return "dev-slicer-worker-secret-not-for-production";
}

export function quoteHmacSecret() {
  if (serverEnv.MANUFACTURING_QUOTE_HMAC_SECRET) {
    return serverEnv.MANUFACTURING_QUOTE_HMAC_SECRET;
  }
  if (process.env.NODE_ENV !== "production") {
    return developmentHmacSecret();
  }
  throw new Error("MANUFACTURING_QUOTE_HMAC_SECRET üretimde zorunludur.");
}

export function slicerWorkerSecret() {
  if (serverEnv.SLICER_WORKER_SECRET) {
    return serverEnv.SLICER_WORKER_SECRET;
  }
  if (process.env.NODE_ENV !== "production") {
    return developmentWorkerSecret();
  }
  return null;
}

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

export function slicerWorkerUrl(): string | null {
  const configured = serverEnv.SLICER_WORKER_URL;
  if (configured) {
    try {
      const hostname = new URL(configured).hostname;
      if (process.env.NODE_ENV === "production" && isLocalHostname(hostname)) {
        return null;
      }
    } catch {
      return null;
    }
    return configured;
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:8788";
  }
  return null;
}

export async function ensureManufacturingDirs() {
  await mkdir(path.join(manufacturingDataRoot(), "objects"), { recursive: true });
}

export async function writePrivateObject(storageKey: string, bytes: Uint8Array) {
  if (manufacturingUsesLocalPersistence()) {
    await ensureManufacturingDirs();
    const target = manufacturingObjectPath(storageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    return;
  }
  const { supabaseWriteObject } = await import("@/lib/manufacturing/supabase-store");
  await supabaseWriteObject(storageKey, bytes);
}

export async function readPrivateObject(storageKey: string): Promise<Uint8Array> {
  if (manufacturingUsesLocalPersistence()) {
    return new Uint8Array(await readFile(manufacturingObjectPath(storageKey)));
  }
  const { supabaseReadObject } = await import("@/lib/manufacturing/supabase-store");
  return supabaseReadObject(storageKey);
}

export async function deletePrivateObject(storageKey: string) {
  await rm(manufacturingObjectPath(storageKey), { force: true });
}

export async function readUtf8IfExists(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
