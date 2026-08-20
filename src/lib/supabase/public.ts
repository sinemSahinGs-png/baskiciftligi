import "server-only";

import { createClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, publicEnv, supabasePublishableKey } from "@/lib/env";

export function createPublicSupabaseClient() {
  if (
    !isSupabaseConfigured ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !supabasePublishableKey
  ) {
    return null;
  }

  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "X-Client-Info": "octo-studio-catalog/1.0",
        },
      },
    },
  );
}
