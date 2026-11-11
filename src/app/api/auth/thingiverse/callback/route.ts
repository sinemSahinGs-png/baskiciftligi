import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import {
  parseThingiverseAccessTokenBody,
  resolveThingiverseRedirectUri,
  THINGIVERSE_API_ORIGIN,
  THINGIVERSE_OAUTH_TOKEN_URL,
} from "@/providers/thingiverse/auth";
import { invalidateThingiverseCache } from "@/providers/thingiverse/client";
import {
  saveThingiverseOauthToken,
  verifyThingiverseOauthState,
} from "@/providers/thingiverse/oauth-store";

export const runtime = "nodejs";

const STATE_COOKIE = "bc_tv_oauth_state";
const ADMIN = "https://baskiciftligi.com/admin/entegrasyonlar";

function redirectWith(status: string) {
  return NextResponse.redirect(new URL(`${ADMIN}?tv=${status}`));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stored = (await cookies()).get(STATE_COOKIE)?.value;

  (await cookies()).delete(STATE_COOKIE);

  if (!code || !verifyThingiverseOauthState(state) || stored !== state) {
    return redirectWith("denied");
  }

  const clientId = serverEnv.THINGIVERSE_CLIENT_ID;
  const clientSecret = serverEnv.THINGIVERSE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectWith("missing_app");
  }

  let tokenBody = "";
  try {
    const tokenResponse = await fetch(THINGIVERSE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "BaskiCiftligi/1.0 (+https://baskiciftligi.com)",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: resolveThingiverseRedirectUri(
          serverEnv.THINGIVERSE_REDIRECT_URI,
        ),
      }),
      cache: "no-store",
    });
    tokenBody = await tokenResponse.text();
    if (!tokenResponse.ok) {
      return redirectWith("token_failed");
    }
  } catch {
    return redirectWith("token_failed");
  }

  const accessToken = parseThingiverseAccessTokenBody(tokenBody);
  if (!accessToken) {
    return redirectWith("token_failed");
  }

  try {
    const probe = await fetch(`${THINGIVERSE_API_ORIGIN}/popular?page=1`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "BaskiCiftligi/1.0 (+https://baskiciftligi.com)",
      },
      cache: "no-store",
    });
    if (!probe.ok) {
      return redirectWith("probe_failed");
    }
    await saveThingiverseOauthToken(accessToken);
    invalidateThingiverseCache();
    return redirectWith("connected");
  } catch {
    return redirectWith("probe_failed");
  }
}
