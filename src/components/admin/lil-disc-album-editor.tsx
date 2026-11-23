"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Trash2, Upload } from "lucide-react";

import {
  deleteLilDiscAlbumAction,
  saveLilDiscAlbumAction,
} from "@/app/admin/lil-disc/actions";
import { initialAdminActionState } from "@/app/admin/admin-state";
import type { LilDiscAlbumRecord } from "@/domain/lil-disc/repository";

function priceTl(minor: number) {
  return String(Math.round(minor / 100));
}

function AlbumForm({
  album,
  isNew,
}: {
  album: LilDiscAlbumRecord;
  isNew?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    saveLilDiscAlbumAction,
    initialAdminActionState,
  );
  const [image, setImage] = useState(album.image);
  const [uploading, setUploading] = useState(false);

  async function onCover(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.set("albumId", album.id || "yeni");
    body.set("file", file);
    const response = await fetch("/api/admin/lil-disc-media", {
      method: "POST",
      body,
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (payload.url) {
      setImage(payload.url);
    }
    setUploading(false);
  }

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-2xl border border-white/10 bg-[#12151a] p-4"
    >
      <input type="hidden" name="id" value={isNew ? "" : album.id} />
      <input type="hidden" name="image" value={image} />
      <input type="hidden" name="sortOrder" value={album.sortOrder} />
      <div className="flex gap-4">
        <label className="relative grid size-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-full object-contain" />
          ) : (
            <Upload className="size-5 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => void onCover(event.target.files?.[0])}
          />
        </label>
        <div className="grid min-w-0 flex-1 gap-2">
          <input
            name="name"
            required
            defaultValue={album.name}
            placeholder="Albüm adı"
            className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm"
          />
          <input
            name="price"
            required
            defaultValue={priceTl(album.priceMinor)}
            placeholder="Fiyat (TL)"
            className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm"
          />
        </div>
      </div>
      <textarea
        name="description"
        defaultValue={album.description}
        rows={2}
        className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={album.published}
        />
        Vitrinde göster
      </label>
      {state.status === "error" ? (
        <p className="text-xs text-red-300">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-xs text-emerald-300">{state.message}</p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#f27a1a] px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {isNew ? "Albüm ekle" : "Kaydet"}
        </button>
        {isNew ? null : (
          <button
            formAction={deleteLilDiscAlbumAction}
            className="grid size-10 place-items-center rounded-full border border-white/15 text-muted-foreground"
            aria-label="Sil"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </form>
  );
}

export function LilDiscAlbumEditor({ albums }: { albums: LilDiscAlbumRecord[] }) {
  const blank: LilDiscAlbumRecord = {
    id: "",
    name: "",
    description: "NFC özellikli mini CD anahtarlık.",
    image: "",
    priceMinor: 20_000,
    published: true,
    sortOrder: albums.length,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AlbumForm album={blank} isNew />
      {albums.map((album) => (
        <AlbumForm key={album.id} album={album} />
      ))}
    </div>
  );
}
