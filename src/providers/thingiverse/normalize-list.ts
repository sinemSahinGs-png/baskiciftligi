import type { ThingiverseThing } from "@/providers/thingiverse/types";

export function normalizeThingList(payload: unknown): ThingiverseThing[] {
  if (Array.isArray(payload)) {
    return payload as ThingiverseThing[];
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["hits", "things", "objects", "results", "docs"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value as ThingiverseThing[];
      }
    }
  }
  const error = new Error("Thingiverse liste biçimi beklenmeyen.");
  (error as Error & { status: number }).status = 502;
  throw error;
}
