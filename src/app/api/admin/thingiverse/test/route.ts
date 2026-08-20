import { NextResponse } from "next/server";

import { requireCatalogOwner } from "@/lib/auth/session";
import { serverEnv } from "@/lib/env.server";
import {
  invalidateThingiverseCache,
  listPopularThings,
  ThingiverseApiError,
} from "@/providers/thingiverse/client";
import {
  getThingiverseConfigStatus,
  mapThingiverseHttpStatus,
} from "@/providers/thingiverse/provider";

export const runtime = "nodejs";

/**
 * Owner-only live probe. Never returns token values.
 */
export async function POST() {
  try {
    await requireCatalogOwner();
  } catch {
    return NextResponse.json({ error: "Yalnızca owner test edebilir." }, { status: 403 });
  }

  const configStatus = getThingiverseConfigStatus();
  const envPresence = {
    THINGIVERSE_CLIENT_ID: Boolean(serverEnv.THINGIVERSE_CLIENT_ID),
    THINGIVERSE_CLIENT_SECRET: Boolean(serverEnv.THINGIVERSE_CLIENT_SECRET),
    THINGIVERSE_ACCESS_TOKEN: Boolean(serverEnv.THINGIVERSE_ACCESS_TOKEN),
    THINGIVERSE_REDIRECT_URI: Boolean(serverEnv.THINGIVERSE_REDIRECT_URI),
    THINGIVERSE_API_BASE_URL: serverEnv.THINGIVERSE_API_BASE_URL ?? "https://api.thingiverse.com",
  };

  if (!serverEnv.THINGIVERSE_ACCESS_TOKEN) {
    return NextResponse.json({
      ok: false,
      configStatus,
      envPresence,
      probe: null,
      message:
        "THINGIVERSE_ACCESS_TOKEN tanımlı değil. Vercel production env’e App Token ekleyin.",
    });
  }

  invalidateThingiverseCache();
  const started = Date.now();
  try {
    const popular = await listPopularThings(1);
    const sample = (popular ?? []).slice(0, 3).map((thing) => ({
      id: thing.id ?? null,
      name: thing.name ? String(thing.name).slice(0, 80) : null,
      hasThumbnail: Boolean(thing.thumbnail || thing.default_image?.url),
      license: thing.license ? String(thing.license).slice(0, 80) : null,
    }));
    return NextResponse.json({
      ok: true,
      configStatus: "connected",
      envPresence,
      probe: {
        endpoint: "GET /popular?page=1",
        httpOk: true,
        latencyMs: Date.now() - started,
        resultCount: popular.length,
        sample,
      },
      message: `Canlı API yanıt verdi (${popular.length} kayıt).`,
    });
  } catch (error) {
    const status =
      error instanceof ThingiverseApiError
        ? mapThingiverseHttpStatus(error.status)
        : "api_unavailable";
    return NextResponse.json({
      ok: false,
      configStatus: status,
      envPresence,
      probe: {
        endpoint: "GET /popular?page=1",
        httpOk: false,
        latencyMs: Date.now() - started,
        resultCount: 0,
        sample: [],
        errorStatus: error instanceof ThingiverseApiError ? error.status : null,
        errorMessage:
          error instanceof Error ? error.message.slice(0, 160) : "Bilinmeyen hata",
      },
      message: "Canlı API çağrısı başarısız. Token veya ağ durumunu kontrol edin.",
    });
  }
}

export async function GET() {
  try {
    await requireCatalogOwner();
  } catch {
    return NextResponse.json({ error: "Yalnızca owner okuyabilir." }, { status: 403 });
  }
  return NextResponse.json({
    configStatus: getThingiverseConfigStatus(),
    envPresence: {
      THINGIVERSE_CLIENT_ID: Boolean(serverEnv.THINGIVERSE_CLIENT_ID),
      THINGIVERSE_CLIENT_SECRET: Boolean(serverEnv.THINGIVERSE_CLIENT_SECRET),
      THINGIVERSE_ACCESS_TOKEN: Boolean(serverEnv.THINGIVERSE_ACCESS_TOKEN),
      THINGIVERSE_REDIRECT_URI: Boolean(serverEnv.THINGIVERSE_REDIRECT_URI),
      THINGIVERSE_API_BASE_URL:
        serverEnv.THINGIVERSE_API_BASE_URL ?? "https://api.thingiverse.com",
    },
  });
}
