import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { passwordsMatch } from "@/lib/auth/admin-password";
import { verifyStaffPassword } from "@/lib/auth/staff-password";
import type { AppRole } from "@/lib/auth/staff-role";
import { serverEnv, supabaseSecretKey } from "@/lib/env.server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const STAFF_SESSION_COOKIE = "octo_staff_session";
const STAFF_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type StaffRecord = {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
};

function signingSecret(): string {
  return [
    serverEnv.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
    supabaseSecretKey,
    serverEnv.ADMIN_PANEL_PASSWORD,
    "octo-staff-session",
  ]
    .filter(Boolean)
    .join(":");
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createStaffSessionToken(record: StaffRecord, nowMs = Date.now()): string {
  const body = Buffer.from(
    JSON.stringify({
      v: 2,
      sub: record.id,
      username: record.username,
      name: record.displayName,
      role: record.role,
      exp: nowMs + STAFF_SESSION_MAX_AGE_SECONDS * 1000,
    }),
    "utf8",
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyStaffSessionToken(
  token: string,
  nowMs = Date.now(),
): StaffRecord | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(body);
  const actualBuf = Buffer.from(mac);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      v?: number;
      sub?: string;
      username?: string;
      name?: string;
      role?: AppRole;
      exp?: number;
    };
    if (payload.v !== 2 || !payload.sub || !payload.role || !payload.exp || payload.exp <= nowMs) {
      return null;
    }
    if (payload.role !== "lil_disc") {
      return null;
    }
    return {
      id: payload.sub,
      username: payload.username ?? "lildisc",
      displayName: payload.name ?? "LIL’ DISC",
      role: "lil_disc",
    };
  } catch {
    return null;
  }
}

export async function createStaffSession(record: StaffRecord): Promise<void> {
  (await cookies()).set(STAFF_SESSION_COOKIE, createStaffSessionToken(record), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STAFF_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearStaffSession(): Promise<void> {
  (await cookies()).delete(STAFF_SESSION_COOKIE);
}

export async function getStaffSessionViewer(): Promise<{
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  isDemo: boolean;
  isActive: boolean;
} | null> {
  const token = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
  if (!token) return null;
  const record = verifyStaffSessionToken(token);
  if (!record) return null;
  return {
    id: record.id,
    email: `${record.username}@staff.octostudio.local`,
    displayName: record.displayName,
    role: record.role,
    isDemo: false,
    isActive: true,
  };
}

export async function authenticateStaff(
  username: string,
  password: string,
): Promise<StaffRecord | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) return null;

  const envUser = serverEnv.LIL_DISC_STAFF_USERNAME?.trim().toLowerCase();
  const envPass = serverEnv.LIL_DISC_STAFF_PASSWORD;
  if (envUser && envPass && normalized === envUser && passwordsMatch(password, envPass)) {
    return {
      id: "env-lildisc",
      username: envUser,
      displayName: envUser === "kutaygulec" ? "Kutay Güleç" : "LIL’ DISC",
      role: "lil_disc",
    };
  }

  const client = createServiceRoleSupabaseClient();
  if (!client) return null;
  const { data } = await client
    .from("staff_accounts")
    .select("id, username, password_hash, display_name, role, is_active")
    .eq("username", normalized)
    .maybeSingle();
  if (!data || data.is_active === false || data.role !== "lil_disc") {
    return null;
  }
  if (!verifyStaffPassword(password, String(data.password_hash))) {
    return null;
  }
  return {
    id: String(data.id),
    username: String(data.username),
    displayName: String(data.display_name),
    role: "lil_disc",
  };
}
