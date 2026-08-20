import "server-only";

import { NextResponse } from "next/server";

import { getPublishedCuratedModel } from "@/domain/curated-models/repository";
import { assertSafeExternalSourceOpenUrl } from "@/lib/models/external-quote-context";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";

export const runtime = "nodejs";

/**
 * Opens only server-resolved canonical source URLs (no open redirect).
 * GET ?kind=curated&id=<uuid|slug>  or  ?kind=thingiverse&id=<numeric>
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") ?? "";
  const id = (searchParams.get("id") ?? "").trim();

  if (!id || id.length > 120) {
    return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  }

  if (kind === "curated") {
    const model = await getPublishedCuratedModel(id);
    if (!model || model.listingKind !== "curated_external") {
      return NextResponse.json({ error: "Model bulunamadı." }, { status: 404 });
    }
    const check = assertSafeExternalSourceOpenUrl(
      model.sourceUrl,
      model.platformType,
    );
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    return NextResponse.redirect(check.canonicalUrl, 302);
  }

  if (kind === "thingiverse") {
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Geçersiz Thingiverse kimliği." }, { status: 400 });
    }
    if (getThingiverseConfigStatus() !== "connected") {
      return NextResponse.json(
        { error: "Thingiverse bağlantısı yok." },
        { status: 503 },
      );
    }
    const url = `https://www.thingiverse.com/thing:${id}`;
    const check = assertSafeExternalSourceOpenUrl(url, "thingiverse");
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    return NextResponse.redirect(check.canonicalUrl, 302);
  }

  return NextResponse.json({ error: "Geçersiz kaynak türü." }, { status: 400 });
}
