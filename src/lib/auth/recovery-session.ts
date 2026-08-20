import "server-only";

import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RECOVERY_COOKIE_MAX_AGE,
} from "@/lib/auth/callback-destination";

export function recoveryCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: PASSWORD_RECOVERY_COOKIE_MAX_AGE,
  };
}

export async function hasPasswordRecoveryCookie(): Promise<boolean> {
  const store = await cookies();
  return store.get(PASSWORD_RECOVERY_COOKIE)?.value === "1";
}

export async function clearPasswordRecoveryCookie(): Promise<void> {
  const store = await cookies();
  store.delete(PASSWORD_RECOVERY_COOKIE);
}

function amrMethods(user: User | null): string[] {
  const amr = (user as User & { amr?: Array<{ method?: string }> } | null)?.amr;
  if (!Array.isArray(amr)) {
    return [];
  }
  return amr
    .map((entry) => entry.method)
    .filter((method): method is string => Boolean(method));
}

export async function isPasswordRecoverySession(
  user: User | null,
): Promise<boolean> {
  if (!user) {
    return false;
  }
  if (amrMethods(user).includes("recovery")) {
    return true;
  }
  return hasPasswordRecoveryCookie();
}
