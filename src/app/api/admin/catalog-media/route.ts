import { NextResponse } from "next/server";

import { requireCatalogWriter } from "@/lib/auth/session";
import { storeCatalogMediaFile } from "@/lib/catalog/media-store";
import { catalogRecordIdSchema } from "@/lib/validation/catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireCatalogWriter();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yetki doğrulanamadı.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const formData = await request.formData();
  const productIdValue = String(formData.get("productId") ?? "");
  const curatedModelIdValue = String(formData.get("curatedModelId") ?? "");
  const productParsed = catalogRecordIdSchema.safeParse(productIdValue);
  const curatedParsed = catalogRecordIdSchema.safeParse(curatedModelIdValue);
  const file = formData.get("file");

  if (!productParsed.success && !curatedParsed.success) {
    return NextResponse.json({ error: "Geçersiz medya kimliği." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Yüklenecek dosya bulunamadı." }, { status: 400 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stored = await storeCatalogMediaFile({
      productId: productParsed.success ? productParsed.data : undefined,
      curatedModelId: curatedParsed.success ? curatedParsed.data : undefined,
      bytes,
      filename: file.name,
      declaredMime: file.type,
    });

    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Medya yüklenemedi.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
