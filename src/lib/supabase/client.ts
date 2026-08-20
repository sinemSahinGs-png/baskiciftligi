"use client";

import { createBrowserClient } from "@supabase/ssr";

import { isSupabaseConfigured, publicEnv, supabasePublishableKey } from "@/lib/env";

export function createBrowserSupabaseClient() {
  if (
    !isSupabaseConfigured ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !supabasePublishableKey
  ) {
    return null;
  }

  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey,
  );
}
