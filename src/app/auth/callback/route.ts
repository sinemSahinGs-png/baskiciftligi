import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function sameOriginDestination(
  request: NextRequest,
  candidate: string | null,
): URL {
  const fallback = new URL("/hesabim", request.url);

  if (!candidate) {
    return fallback;
  }

  try {
    const destination = new URL(candidate, request.url);

    if (destination.origin !== request.nextUrl.origin) {
      return fallback;
    }

    return destination;
  } catch {
    return fallback;
  }
}

function loginErrorRedirect(request: NextRequest, reason: string): NextResponse {
  const destination = new URL("/giris", request.url);
  destination.searchParams.set("error", reason);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return loginErrorRedirect(request, "auth-not-configured");
  }

  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return loginErrorRedirect(request, "missing-code");
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return loginErrorRedirect(request, "auth-not-configured");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return loginErrorRedirect(request, "exchange-failed");
  }

  return NextResponse.redirect(
    sameOriginDestination(request, request.nextUrl.searchParams.get("next")),
  );
}
