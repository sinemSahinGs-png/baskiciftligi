import "server-only";

import {
  defaultLilDiscAlbums,
  type LilDiscAlbumInput,
} from "@/domain/project-destinations/catalog";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type LilDiscAlbumRecord = LilDiscAlbumInput & {
  published: boolean;
  sortOrder: number;
};

function fallbackRecords(): LilDiscAlbumRecord[] {
  return defaultLilDiscAlbums().map((album, index) => ({
    ...album,
    published: true,
    sortOrder: index,
  }));
}

export async function listLilDiscAlbumRecords(): Promise<LilDiscAlbumRecord[]> {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return fallbackRecords();
  }
  const { data, error } = await client
    .from("lil_disc_albums")
    .select("id, name, description, price_minor, image_url, sort_order, is_published")
    .order("sort_order", { ascending: true });
  if (error || !data?.length) {
    return fallbackRecords();
  }
  return data.map((row, index) => ({
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? "NFC özellikli mini CD anahtarlık."),
    image: String(row.image_url),
    priceMinor: Number(row.price_minor),
    published: row.is_published !== false,
    sortOrder: Number(row.sort_order ?? index),
  }));
}

export async function listPublishedLilDiscAlbums(): Promise<LilDiscAlbumInput[]> {
  return (await listLilDiscAlbumRecords())
    .filter((album) => album.published)
    .map(({ published: _published, sortOrder: _sort, ...album }) => album);
}

export async function upsertLilDiscAlbum(
  album: LilDiscAlbumRecord,
): Promise<void> {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    throw new Error("LIL DISC kataloğu için veritabanı yok.");
  }
  const { error } = await client.from("lil_disc_albums").upsert({
    id: album.id,
    name: album.name,
    description: album.description,
    price_minor: album.priceMinor,
    image_url: album.image,
    sort_order: album.sortOrder,
    is_published: album.published,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteLilDiscAlbum(id: string): Promise<void> {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    throw new Error("LIL DISC kataloğu için veritabanı yok.");
  }
  const { error } = await client.from("lil_disc_albums").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
