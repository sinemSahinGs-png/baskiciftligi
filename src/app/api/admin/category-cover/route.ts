import { NextResponse } from "next/server";

import { requireCatalogWriter } from "@/lib/auth/session";
import { storeCategoryCoverPng } from "@/lib/catalog/media-store";
import { categoryFormSchema } from "@/lib/validation/catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireCatalogWriter();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yetki doğrulanamadı.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const formData = await request.formData();
  const slugValue = String(formData.get("slug") ?? "");
  const slug = categoryFormSchema.shape.slug.safeParse(slugValue);
  const file = formData.get("file");

  if (!slug.success) {
    return NextResponse.json(
      { error: "Önce geçerli bir kategori slug’ı girin." },
      { status: 400 },
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Yüklenecek PNG bulunamadı." }, { status: 400 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stored = await storeCategoryCoverPng({
      slug: slug.data,
      bytes,
      filename: file.name,
      declaredMime: file.type,
    });
    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kategori görseli yüklenemedi.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
