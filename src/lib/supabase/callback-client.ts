import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured, publicEnv, supabasePublishableKey } from "@/lib/env";

type PendingCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export function createCallbackSupabaseClient(request: NextRequest) {
  const pending: PendingCookie[] = [];

  if (
    !isSupabaseConfigured ||
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !supabasePublishableKey
  ) {
    return { client: null, pending };
  }

  const client = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pending.push({ name, value, options });
          });
        },
      },
    },
  );

  return { client, pending };
}

export function applyPendingCookies(
  response: NextResponse,
  pending: PendingCookie[],
) {
  pending.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
