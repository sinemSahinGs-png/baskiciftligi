import { NextResponse } from "next/server";

import { requireCatalogOwner } from "@/lib/auth/session";
import { serverEnv } from "@/lib/env.server";
import {
  resolveThingiverseRedirectUri,
  THINGIVERSE_OAUTH_AUTHORIZE_URL,
} from "@/providers/thingiverse/auth";
import { createThingiverseOauthState } from "@/providers/thingiverse/oauth-store";

export const runtime = "nodejs";

const STATE_COOKIE = "bc_tv_oauth_state";

export async function GET(request: Request) {
  try {
    await requireCatalogOwner();
  } catch {
    return NextResponse.json(
      { error: "Yalnızca owner Thingiverse bağlayabilir." },
      { status: 403 },
    );
  }

  const clientId = serverEnv.THINGIVERSE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/admin/entegrasyonlar?tv=missing_app", request.url),
    );
  }

  const state = createThingiverseOauthState();
  const authorize = new URL(THINGIVERSE_OAUTH_AUTHORIZE_URL);
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set(
    "redirect_uri",
    resolveThingiverseRedirectUri(serverEnv.THINGIVERSE_REDIRECT_URI),
  );

  const response = NextResponse.redirect(authorize);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
