import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RECOVERY_PATH,
  mapCodeExchangeError,
  planAuthCallback,
  recoveryErrorHref,
  urlContainsAuthSecrets,
} from "@/lib/auth/callback-destination";
import { recoveryCookieOptions } from "@/lib/auth/recovery-session";
import { isSupabaseConfigured } from "@/lib/env";
import {
  applyPendingCookies,
  createCallbackSupabaseClient,
} from "@/lib/supabase/callback-client";

function recoveryErrorRedirect(
  request: NextRequest,
  reason: ReturnType<typeof mapCodeExchangeError> | "malformed",
) {
  return NextResponse.redirect(new URL(recoveryErrorHref(reason), request.url));
}

function loginErrorRedirect(request: NextRequest, reason: string) {
  const destination = new URL("/giris", request.url);
  destination.searchParams.set("error", reason);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  if (urlContainsAuthSecrets(request.nextUrl.href)) {
    return recoveryErrorRedirect(request, "malformed");
  }

  if (!isSupabaseConfigured) {
    return loginErrorRedirect(request, "auth-not-configured");
  }

  const plan = planAuthCallback(request.nextUrl);

  if (plan.action === "error") {
    if (plan.recovery || plan.next === PASSWORD_RECOVERY_PATH) {
      const reason =
        plan.reason === "missing-code" ? "malformed" : plan.reason;
      return recoveryErrorRedirect(request, reason);
    }
    return loginErrorRedirect(request, plan.reason);
  }

  const { client, pending } = createCallbackSupabaseClient(request);
  if (!client) {
    return plan.recovery
      ? recoveryErrorRedirect(request, "malformed")
      : loginErrorRedirect(request, "auth-not-configured");
  }

  const { error } = await client.auth.exchangeCodeForSession(plan.code);

  if (error) {
    const reason = mapCodeExchangeError(error.message);
    return plan.recovery
      ? recoveryErrorRedirect(request, reason)
      : loginErrorRedirect(request, "exchange-failed");
  }

  if (plan.recovery) {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return recoveryErrorRedirect(request, "malformed");
    }
  }

  const destination = new URL(plan.next, request.url);
  if (urlContainsAuthSecrets(destination.href)) {
    return recoveryErrorRedirect(request, "malformed");
  }

  const response = NextResponse.redirect(destination);
  applyPendingCookies(response, pending);
  if (plan.recovery) {
    response.cookies.set(
      PASSWORD_RECOVERY_COOKIE,
      "1",
      recoveryCookieOptions(request.nextUrl.protocol === "https:"),
    );
  }
  return response;
}
