"use server";

import { revalidatePath } from "next/cache";

import {
  deleteLilDiscAlbum,
  upsertLilDiscAlbum,
} from "@/domain/lil-disc/repository";
import { requireLilDiscManager } from "@/lib/auth/session";
import { slugifyTurkish } from "@/lib/catalog/slug";
import { parseTryToMinor } from "@/lib/money";
import type { AdminActionState } from "@/app/admin/admin-state";

function refreshLilDisc() {
  revalidatePath("/admin/lil-disc");
  revalidatePath("/kategori/lil-disc");
  revalidatePath("/admin");
}

export async function saveLilDiscAlbumAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireLilDiscManager();
  const name = String(formData.get("name") ?? "").trim();
  const existingId = String(formData.get("id") ?? "").trim();
  const id = existingId || slugifyTurkish(name);
  const price = parseTryToMinor(String(formData.get("price") ?? ""));
  if (!name || !id || price == null) {
    return { status: "error", message: "Albüm adı ve fiyat gerekli." };
  }
  try {
    await upsertLilDiscAlbum({
      id,
      name,
      description: String(formData.get("description") ?? "").trim() ||
        "NFC özellikli mini CD anahtarlık.",
      image: String(formData.get("image") ?? "").trim() ||
        "/categories/lil-disc/poster.webp",
      priceMinor: price,
      published: formData.get("published") === "on",
      sortOrder: Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0,
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Kaydedilemedi.",
    };
  }
  refreshLilDisc();
  return { status: "success", message: `${name} güncellendi.` };
}

export async function deleteLilDiscAlbumAction(formData: FormData) {
  await requireLilDiscManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteLilDiscAlbum(id);
  refreshLilDisc();
}
