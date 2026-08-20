import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { isSupabaseConfigured, publicEnv, supabasePublishableKey } from "@/lib/env";

export async function createServerSupabaseClient() {
  if (
    !isSupabaseConfigured ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !supabasePublishableKey
  ) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. The proxy refreshes sessions.
          }
        },
      },
    },
  );
}
