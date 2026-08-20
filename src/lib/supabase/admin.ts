import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { supabaseSecretKey } from "@/lib/env.server";

let cached: SupabaseClient | null | undefined;

/**
 * Server-only service-role client. Never import from Client Components.
 * Used for manufacturing persistence, worker claim RPCs, and trusted admin jobs.
 */
export function createServiceRoleSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) {
    return cached;
  }
  if (
    !isSupabaseConfigured ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !supabaseSecretKey
  ) {
    cached = null;
    return cached;
  }

  cached = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "X-Client-Info": "baski-ciftligi-service/1.0",
        },
      },
    },
  );
  return cached;
}

export function assertServiceRoleClient(): SupabaseClient {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase service-role istemcisi yapılandırılmadı. Üretim kalıcılığı için URL, anon ve service-role anahtarları gerekir.",
    );
  }
  return client;
}
