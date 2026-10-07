import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getLocalWholesaleStore } from "@/lib/wholesale/local-store";
import type { WholesaleStore } from "@/lib/wholesale/memory-store";
import { createSupabaseWholesaleStore } from "@/lib/wholesale/supabase-store";

let backend: "supabase" | "local" | null = null;

function isMissingWholesaleSchema(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "PGRST205" ||
    message.includes("wholesale_settings") ||
    message.includes("wholesale_orders")
  );
}

export async function getWholesaleStore(): Promise<WholesaleStore> {
  if (backend === "local") {
    return getLocalWholesaleStore();
  }
  if (backend === "supabase") {
    return createSupabaseWholesaleStore();
  }

  if (isSupabaseConfigured) {
    const store = createSupabaseWholesaleStore();
    try {
      await store.getSettings();
      backend = "supabase";
      return store;
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      if (isMissingWholesaleSchema(error)) {
        backend = "local";
        return getLocalWholesaleStore();
      }
      throw error;
    }
  }

  backend = "local";
  return getLocalWholesaleStore();
}

export function resetWholesaleStoreBackend() {
  backend = null;
}
