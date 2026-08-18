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

export async function hasAdminPasswordSession(): Promise<boolean> {
  if (!isLocalAdminPasswordEnabled()) {
    return true;
  }

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }

  return verifyAdminSessionToken(token, signingKey());
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
  if (!isLocalAdminPasswordEnabled()) {
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
