import "server-only";

import { cookies } from "next/headers";

import { isDevelopmentDemoMode } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  passwordsMatch,
  sessionSigningKey,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-password";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function configuredPassword(): string {
  return serverEnv.ADMIN_PANEL_PASSWORD ?? "";
}

function signingKey() {
  return sessionSigningKey(
    configuredPassword(),
    serverEnv.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY ?? "",
  );
}

export function isLocalAdminPasswordEnabled(): boolean {
  return isDevelopmentDemoMode && Boolean(configuredPassword());
}

export function isAdminPasswordAuthEnabled(): boolean {
  return Boolean(configuredPassword());
}

export function ownerPasswordUsernames(): string[] {
  const extra = serverEnv.ADMIN_PANEL_USERNAME?.trim().toLowerCase();
  return ["ata", "admin", "owner", extra].filter(
    (value, index, list): value is string => Boolean(value) && list.indexOf(value) === index,
  );
}

export function isOwnerPasswordUsername(username: string): boolean {
  const normalized = username.trim().toLowerCase();
  return normalized === "" || ownerPasswordUsernames().includes(normalized);
}

export async function hasAdminPasswordSession(): Promise<boolean> {
  if (!isAdminPasswordAuthEnabled()) {
    return false;
  }

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }

  return verifyAdminSessionToken(token, signingKey());
}

export async function getOwnerPasswordViewer(): Promise<{
  id: string;
  email: string;
  displayName: string;
  role: "owner";
  isDemo: boolean;
  isActive: boolean;
} | null> {
  if (!(await hasAdminPasswordSession())) {
    return null;
  }
  const username = ownerPasswordUsernames()[0] ?? "ata";
  return {
    id: "password-owner",
    email: `${username}@octostudio.local`,
    displayName: "ATA",
    role: "owner",
    isDemo: isDevelopmentDemoMode,
    isActive: true,
  };
}

export async function createAdminPasswordSession(): Promise<void> {
  const token = createAdminSessionToken(signingKey());
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminPasswordSession(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

export function verifyAdminPasswordAttempt(
  password: string,
  attemptKey = "local",
): { ok: true } | { ok: false; message: string } {
  if (!isAdminPasswordAuthEnabled()) {
    return { ok: false, message: "Yönetici şifresi bu ortamda kapalı." };
  }

  const now = Date.now();
  const current = loginAttempts.get(attemptKey);
  if (current && current.resetAt > now && current.count >= 8) {
    return {
      ok: false,
      message: "Çok fazla deneme. Birkaç dakika sonra yeniden deneyin.",
    };
  }

  if (!passwordsMatch(password, configuredPassword())) {
    const nextCount = current && current.resetAt > now ? current.count + 1 : 1;
    loginAttempts.set(attemptKey, {
      count: nextCount,
      resetAt: now + 15 * 60 * 1000,
    });
    return { ok: false, message: "Şifre hatalı." };
  }

  loginAttempts.delete(attemptKey);
  return { ok: true };
}
