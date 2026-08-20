"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LoaderCircle,
  Star,
  Trash2,
  ZoomIn,
} from "lucide-react";
import type {
  FieldArrayWithId,
  UseFieldArrayReturn,
  UseFormSetValue,
} from "react-hook-form";

import type { ProductFormInput } from "@/lib/validation/catalog";

import { ACCEPTED_IMAGE_TYPES } from "./constants";

type GuidedMediaUploaderProps = {
  productId: string;
  fields: FieldArrayWithId<ProductFormInput, "media", "id">[];
  mediaArray: UseFieldArrayReturn<ProductFormInput, "media", "id">;
  setValue: UseFormSetValue<ProductFormInput>;
  watchedName: string;
  onUploadingChange?: (uploading: boolean) => void;
  uploading?: boolean;
};

export function GuidedMediaUploader({
  productId,
  fields,
  mediaArray,
  setValue,
  watchedName,
  onUploadingChange,
}: GuidedMediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(
    null,
  );
  const [uploadSuccessPulse, setUploadSuccessPulse] = useState(false);

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    setError("");
    setUploading(true);
    onUploadingChange?.(true);
    const files = Array.from(fileList);
    let completed = 0;

    for (const [index, file] of files.entries()) {
      setProgress(Math.round((completed / files.length) * 100));
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
        completed += 1;
        setProgress(Math.round((completed / files.length) * 100));
        setUploadSuccessPulse(true);
        window.setTimeout(() => setUploadSuccessPulse(false), 700);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error ? uploadError.message : "Yükleme başarısız.",
        );
      }
    }

    setUploading(false);
    onUploadingChange?.(false);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function confirmRemove(index: number) {
    if (pendingDeleteIndex === index) {
      mediaArray.remove(index);
      setPendingDeleteIndex(null);
      return;
    }
    setPendingDeleteIndex(index);
    window.setTimeout(() => setPendingDeleteIndex(null), 4000);
  }

  const hasImages = fields.length > 0;

  return (
    <div id="media-upload" className="space-y-4">
      {!hasImages ? (
        <label
          className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition-colors motion-reduce:transition-none sm:min-h-56 ${
            dragOver
              ? "border-cyan bg-cyan/10"
              : "border-white/15 bg-black/20 hover:border-cyan/40"
          } ${uploadSuccessPulse ? "editor-upload-success" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void uploadFiles(event.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            multiple
            className="sr-only"
            aria-label="Ürün görselleri yükle"
            onChange={(event) => void uploadFiles(event.target.files)}
          />
          {uploading ? (
            <LoaderCircle className="size-8 animate-spin text-cyan" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-8 text-cyan" aria-hidden="true" />
          )}
          <span className="mt-3 text-base font-semibold">Kapak görseli yükle</span>
          <span className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            JPG, PNG, WebP veya AVIF · 4:5 oranı önerilir · en fazla 20 MB
          </span>
          {uploading ? (
            <div className="mt-4 w-full max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-cyan transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-cyan">%{progress}</p>
            </div>
          ) : null}
        </label>
      ) : (
        <>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-dashed border-cyan/35 px-4 text-sm font-semibold text-cyan">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              multiple
              className="sr-only"
              aria-label="Ürün görselleri yükle"
              onChange={(event) => void uploadFiles(event.target.files)}
            />
            <ImagePlus className="size-4" />
            Görsel ekle
          </label>
          {uploading ? (
            <p className="text-xs text-cyan">Yükleniyor… %{progress}</p>
          ) : null}
        </>
      )}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {hasImages ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3"
            >
              <button
                type="button"
                className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30"
                onClick={() => setPreviewUrl(field.url)}
                aria-label="Görseli büyüt"
              >
                {field.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={field.url} alt="" className="size-full object-cover" />
                ) : null}
                <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <ZoomIn className="size-4 text-white" />
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {field.alt || `Görsel ${index + 1}`}
                </p>
                <p className="text-xs font-semibold text-cyan">
                  {field.role === "cover" ? "Kapak görseli" : "Galeri"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => mediaArray.move(index, index - 1)}
                  disabled={index === 0}
                  className="grid size-9 place-items-center rounded-full border border-white/10 disabled:opacity-30"
                  aria-label="Yukarı taşı"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => mediaArray.move(index, index + 1)}
                  disabled={index === fields.length - 1}
                  className="grid size-9 place-items-center rounded-full border border-white/10 disabled:opacity-30"
                  aria-label="Aşağı taşı"
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setValue(`media.${index}.role`, "cover", { shouldDirty: true })
                  }
                  className="grid size-9 place-items-center rounded-full border border-white/10"
                  aria-label="Kapak yap"
                >
                  <Star className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => confirmRemove(index)}
                  className="grid size-9 place-items-center rounded-full border border-destructive/20 text-destructive"
                  aria-label="Kaldır"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {pendingDeleteIndex !== null ? (
        <p className="text-xs text-amber-200">
          Silmek için tekrar dokunun veya onaylayın.
        </p>
      ) : null}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Görsel önizlemesi"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Kapat"
            onClick={() => setPreviewUrl(null)}
          />
          <div className="relative max-h-[85vh] max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-card p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="max-h-[80vh] w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 min-h-11 rounded-full border border-white/15 bg-black/60 px-4 text-xs font-semibold"
            >
              Kapat
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
