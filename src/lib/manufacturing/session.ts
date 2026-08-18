import { cookies } from "next/headers";

import { getViewer } from "@/lib/auth/session";

export const MANUFACTURING_SESSION_COOKIE = "bc_mf_sid";

export interface ManufacturingActor {
  userId: string | null;
  sessionId: string;
  role: string | null;
}

function newSessionId() {
  return crypto.randomUUID();
}

export async function getManufacturingActor(): Promise<ManufacturingActor> {
  const viewer = await getViewer();
  const store = await cookies();
  let sessionId = store.get(MANUFACTURING_SESSION_COOKIE)?.value;
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    sessionId = newSessionId();
    try {
      store.set(MANUFACTURING_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } catch {
      // Server Components cannot always write cookies.
    }
  }
  return {
    userId: viewer?.id ?? null,
    sessionId,
    role: viewer?.role ?? null,
  };
}

export function ownsRecord(
  actor: ManufacturingActor,
  record: { ownerUserId: string | null; sessionId: string },
) {
  if (actor.userId && record.ownerUserId === actor.userId) {
    return true;
  }
  return record.sessionId === actor.sessionId;
}
