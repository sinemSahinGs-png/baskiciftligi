"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LoaderCircle,
  Star,
  Trash2,
} from "lucide-react";
import type {
  FieldArrayWithId,
  UseFieldArrayReturn,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductFormInput } from "@/lib/validation/catalog";

interface ProductMediaManagerProps {
  productId: string;
  fields: FieldArrayWithId<ProductFormInput, "media", "id">[];
  mediaArray: UseFieldArrayReturn<ProductFormInput, "media", "id">;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  watchedName: string;
  errors?: {
    [index: number]: { url?: { message?: string }; alt?: { message?: string } };
  };
}

const roleOptions = [
  ["cover", "Kapak"],
  ["hover", "Hover"],
  ["mobile", "Mobil"],
  ["gallery", "Galeri"],
  ["dimensions", "Ölçü"],
  ["detail", "Detay"],
  ["lifestyle", "Yaşam"],
  ["social", "Sosyal"],
  ["video", "Video"],
  ["primary", "Ana (eski)"],
] as const;

export function ProductMediaManager({
  productId,
  fields,
  mediaArray,
  register,
  setValue,
  watchedName,
  errors,
}: ProductMediaManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    setError("");
    setUploading(true);
    const files = Array.from(fileList);

    for (const [index, file] of files.entries()) {
      setProgress(`${index + 1}/${files.length} yükleniyor…`);
      const body = new FormData();
      body.set("productId", productId);
      body.set("file", file);

      try {
        const response = await fetch("/api/admin/catalog-media", {
          method: "POST",
          body,
        });
        const payload = (await response.json()) as {
          error?: string;
          id?: string;
          url?: string;
          storagePath?: string;
          mimeType?: string;
          kind?: string;
        };

        if (!response.ok || !payload.url || !payload.id) {
          throw new Error(payload.error ?? "Yükleme başarısız.");
        }

        mediaArray.append({
          id: payload.id,
          url: payload.url,
          alt: watchedName || file.name.replace(/\.[^.]+$/, ""),
          position: fields.length + index,
          role: fields.length + index === 0 ? "cover" : "gallery",
          storagePath: payload.storagePath,
          mimeType: payload.mimeType,
          objectPosition: "50% 40%",
          mobileObjectPosition: "50% 30%",
        });
      } catch (uploadError) {
        setError(
          uploadError instanceof Error ? uploadError.message : "Yükleme başarısız.",
        );
      }
    }

    setUploading(false);
    setProgress("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-cyan/30 bg-cyan/5 p-4 text-xs leading-5 text-muted-foreground">
        <p className="font-semibold text-foreground">Kapak önerisi</p>
        <p className="mt-1">
          Oran 4:5, yüksek çözünürlük, ürün net görünsün. Şeffaf veya kontrollü
          arka plan tercih edin. Geometri veya rengi yanıltacak işlem yapmayın.
        </p>
        <p className="mt-2">
          Galeri: ürün odaklı, ölçü, detay, yaşam ve yakın çekim. Arka plan
          otomatik silinmez.
        </p>
      </div>

      <label
        className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 text-center"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          void uploadFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,video/mp4,video/webm"
          multiple
          className="sr-only"
          aria-label="Ürün görselleri yükle"
          onChange={(event) => void uploadFiles(event.target.files)}
        />
        {uploading ? (
          <LoaderCircle className="size-6 animate-spin text-cyan" aria-hidden="true" />
        ) : (
          <ImagePlus className="size-6 text-cyan" aria-hidden="true" />
        )}
        <span className="mt-3 text-sm font-semibold text-foreground">
          Görselleri sürükleyin veya seçin
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          PNG, JPEG, WebP, AVIF, MP4, WebM · en fazla 20 MB
        </span>
        {progress ? <span className="mt-2 text-xs text-cyan">{progress}</span> : null}
      </label>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-2xl border border-white/10 bg-black/15 p-4"
        >
          <input type="hidden" {...register(`media.${index}.id`)} />
          <input type="hidden" {...register(`media.${index}.storagePath`)} />
          <input
            type="hidden"
            value={index}
            {...register(`media.${index}.position`, { valueAsNumber: true })}
          />
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Medya {index + 1}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => mediaArray.move(index, index - 1)}
                disabled={index === 0}
                className="grid size-8 place-items-center rounded-full border border-white/10 disabled:opacity-30"
                aria-label={`Görsel ${index + 1} yukarı taşı`}
              >
                <ArrowUp className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => mediaArray.move(index, index + 1)}
                disabled={index === fields.length - 1}
                className="grid size-8 place-items-center rounded-full border border-white/10 disabled:opacity-30"
                aria-label={`Görsel ${index + 1} aşağı taşı`}
              >
                <ArrowDown className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue(`media.${index}.role`, "cover", { shouldDirty: true });
                }}
                className="grid size-8 place-items-center rounded-full border border-white/10"
                aria-label="Kapak yap"
              >
                <Star className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => mediaArray.remove(index)}
                className="grid size-8 place-items-center rounded-full border border-destructive/20 text-destructive"
                aria-label={`Görsel ${index + 1} kaldır`}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[7.5rem_minmax(0,1fr)]">
            <div className="aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {field.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={field.url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-[0.65rem] text-muted-foreground">
                  Önizleme yok
                </div>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`media-${index}-role`}>Görsel rolü</Label>
                <select
                  id={`media-${index}-role`}
                  {...register(`media.${index}.role`)}
                  className="h-11 w-full rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm"
                >
                  {roleOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`media-${index}-object`}>Object position</Label>
                <Input
                  id={`media-${index}-object`}
                  {...register(`media.${index}.objectPosition`)}
                  placeholder="50% 40%"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`media-${index}-url`}>Görsel URL</Label>
                <Input
                  id={`media-${index}-url`}
                  {...register(`media.${index}.url`)}
                  placeholder="https://… veya /catalog-media/…"
                />
                {errors?.[index]?.url?.message ? (
                  <p className="text-xs text-destructive">{errors[index]?.url?.message}</p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`media-${index}-alt`}>Alternatif metin</Label>
                <Input id={`media-${index}-alt`} {...register(`media.${index}.alt`)} />
                {errors?.[index]?.alt?.message ? (
                  <p className="text-xs text-destructive">{errors[index]?.alt?.message}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          mediaArray.append({
            url: "",
            alt: watchedName || "Ürün görseli",
            position: fields.length,
            role: "gallery",
          })
        }
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dashed border-cyan/35 px-4 text-sm font-semibold text-cyan hover:bg-cyan/5"
      >
        <ImagePlus className="size-4" aria-hidden="true" />
        URL ekle
      </button>
    </div>
  );
}
