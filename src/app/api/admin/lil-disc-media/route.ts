import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { canManageLilDisc } from "@/lib/catalog/authorization";
import { storeCatalogMediaFile } from "@/lib/catalog/media-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await requireAdmin();
  if (!canManageLilDisc(viewer.role)) {
    return NextResponse.json({ error: "Yetki yok." }, { status: 403 });
  }

  const formData = await request.formData();
  const albumId = String(formData.get("albumId") ?? "yeni").replace(/[^a-z0-9-]/gi, "") || "yeni";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Dosya yok." }, { status: 400 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stored = await storeCatalogMediaFile({
      productId: `proj-cep-album-${albumId}`,
      bytes,
      filename: file.name,
      declaredMime: file.type,
      serviceRole: true,
    });
    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yüklenemedi.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
