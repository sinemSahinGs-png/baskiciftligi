"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { saveQuickProductAction } from "@/app/admin/actions";
import { initialAdminActionState } from "@/app/admin/admin-state";

export function QuickProductForm({
  categories,
}: {
  categories: Array<{ slug: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    saveQuickProductAction,
    initialAdminActionState,
  );
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.set("productId", crypto.randomUUID().replace(/-/g, "").slice(0, 32));
    body.set("file", file);
    const response = await fetch("/api/admin/catalog-media", {
      method: "POST",
      body,
    });
    const payload = (await response.json()) as { url?: string };
    if (payload.url) setImage(payload.url);
    setUploading(false);
  }

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-[#12151a] p-6"
    >
      <input type="hidden" name="image" value={image} />
      <label className="block text-sm font-semibold">
        Ürün adı
        <input
          required
          name="name"
          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        Fiyat (TL)
        <input
          required
          name="price"
          inputMode="numeric"
          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
        />
      </label>
      <label className="block text-sm font-semibold">
        Kategori
        <select
          name="category"
          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
        >
          <option value="">Seçilmedi</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Kapak
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="mt-2 block w-full text-sm"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
      </label>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-28 rounded-lg object-cover" />
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="publish" defaultChecked />
        Hemen yayınla
      </label>
      {state.status === "error" ? (
        <p className="text-sm text-red-300">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-300">{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending || uploading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f27a1a] text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Ürünü kaydet
      </button>
    </form>
  );
}
