"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ExternalLink, UploadCloud, X } from "lucide-react";

import { SafeImage } from "@/components/media/safe-image";
import {
  clearExternalQuoteContext,
  persistExternalQuoteContext,
  setPendingExternalUpload,
  type ExternalQuoteModelContext,
} from "@/lib/models/external-quote-context";
import { announceStatus } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".stl", ".obj", ".3mf"] as const;
const ACCEPT = ".stl,.obj,.3mf,model/stl,application/sla,model/obj,model/3mf";

export const EXTERNAL_RIGHTS_COPY =
  "Bu dosyayı üretme ve çoğaltma hakkına sahip olduğumu ve kaynak modelin lisans koşullarını kontrol ettiğimi onaylıyorum.";

function isAllowedFile(file: File) {
  const name = file.name.toLocaleLowerCase("tr-TR");
  if (ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return true;
  }
  // Reject camera/photo MIME types on mobile
  if (file.type.startsWith("image/")) {
    return false;
  }
  return false;
}

function sourceOpenHref(context: ExternalQuoteModelContext) {
  if (context.sourceType === "thingiverse") {
    return `/api/hazir-modeller/source-open?kind=thingiverse&id=${encodeURIComponent(context.externalModelId)}`;
  }
  const id = context.slug || context.externalModelId;
  return `/api/hazir-modeller/source-open?kind=curated&id=${encodeURIComponent(id)}`;
}

export function ExternalModelPriceModal({
  open,
  onOpenChange,
  model,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: ExternalQuoteModelContext | null;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const lastOpenModelId = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !model) {
      if (!open) lastOpenModelId.current = null;
      return;
    }
    persistExternalQuoteContext(model);
    const sessionKey = `${model.externalModelId}:${open}`;
    if (lastOpenModelId.current === sessionKey) return;
    lastOpenModelId.current = sessionKey;
    queueMicrotask(() => {
      setFile(null);
      setRights(false);
      setError(null);
    });
  }, [open, model]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function acceptFile(next: File | undefined) {
    if (!next) return;
    if (!isAllowedFile(next)) {
      setError(
        "Yalnızca STL, 3MF veya OBJ yükleyebilirsiniz. STEP henüz dönüştürücüye bağlı değil; kaynaktan STL/3MF/OBJ indirin.",
      );
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("Dosya 100 MB sınırını aşıyor.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(next);
    announceStatus(`${next.name} seçildi. Analiz için hak onayı gerekli.`);
  }

  function continueToConfigurator() {
    if (!model) return;
    if (!file) {
      setError("Önce bir model dosyası seçin.");
      return;
    }
    if (!rights) {
      setError(EXTERNAL_RIGHTS_COPY);
      return;
    }
    setPendingExternalUpload({
      file,
      context: model,
      rightsConfirmed: true,
    });
    persistExternalQuoteContext(model);
    onOpenChange(false);
    const params = new URLSearchParams({
      sourceModel: model.sourceType,
      externalId: model.externalModelId,
    });
    router.push(`/model-yukle?${params.toString()}`);
  }

  if (!model) {
    return null;
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          clearExternalQuoteContext();
          returnFocusRef?.current?.focus();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-external-price-modal-backdrop=""
          className={cn(
            "fixed inset-0 z-50 bg-midnight/70 supports-backdrop-filter:backdrop-blur-md",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            "motion-reduce:animate-none",
          )}
        />
        <DialogPrimitive.Popup
          data-external-price-modal=""
          aria-labelledby={titleId}
          className={cn(
            "fixed z-50 flex max-h-[min(92dvh,880px)] w-full flex-col overflow-hidden border border-white/12 bg-carbon text-light-text shadow-2xl outline-none",
            "max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-2xl",
            "md:top-1/2 md:left-1/2 md:max-w-[720px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 max-md:data-open:slide-in-from-bottom-4",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "motion-reduce:animate-none motion-reduce:data-open:zoom-in-100",
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-muted-light uppercase">
                Harici model · fiyat
              </p>
              <DialogPrimitive.Title
                id={titleId}
                className="mt-1 font-heading text-xl font-bold tracking-[-0.03em] sm:text-2xl"
              >
                Model dosyanı yükle, fiyatını hesaplayalım
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              className="grid size-10 shrink-0 place-items-center rounded-md border border-white/15 text-light-text"
              aria-label="Kapat"
            >
              <X className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex gap-3 rounded-xl border border-white/10 bg-midnight/40 p-3">
              <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md bg-midnight">
                {model.previewImageUrl ? (
                  <SafeImage
                    src={model.previewImageUrl}
                    alt={model.imageAlt || model.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                    fallbackLabel=""
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-light">
                  {model.platformLabel}
                  {model.categoryLabel ? ` · ${model.categoryLabel}` : ""}
                </p>
                <p className="mt-1 line-clamp-2 font-heading text-base font-semibold">
                  {model.title}
                </p>
                <p className="mt-2 text-xs text-muted-light">
                  Dosya yüklenmeden fiyat gösterilmez.
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-sm">
              <li className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="font-semibold text-coral">1. Kaynak sayfasını aç</p>
                <p className="mt-1 text-muted-light">
                  Modelin orijinal sayfasına giderek kullanım koşullarını ve
                  lisansını kontrol et.
                </p>
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="font-semibold text-coral">2. Dosyayı indir</p>
                <p className="mt-1 text-muted-light">
                  Üretmek istediğin STL, 3MF, OBJ veya STEP dosyasını cihazına
                  indir. (Yükleme şu an STL/3MF/OBJ kabul eder.)
                </p>
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="font-semibold text-coral">3. Dosyayı yükle</p>
                <p className="mt-1 text-muted-light">
                  İndirdiğin dosyayı aşağıdaki alana yükle. Teknik analizden önce
                  fiyat gösterilmez.
                </p>
              </li>
            </ol>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                acceptFile(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
                dragOver
                  ? "border-coral bg-coral/10"
                  : "border-white/20 bg-midnight/30",
              )}
            >
              <UploadCloud className="mx-auto size-7 text-muted-light" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">Dosyayı sürükle veya seç</p>
              <p className="mt-1 text-xs text-muted-light">
                STL, 3MF, OBJ · en fazla 100 MB
              </p>
              <input
                ref={fileInputRef}
                data-external-model-file=""
                type="file"
                accept={ACCEPT}
                className="sr-only"
                // Prevent mobile camera capture prompts
                capture={undefined}
                onChange={(event) => {
                  acceptFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              {file ? (
                <p className="mt-3 text-sm text-light-text">{file.name}</p>
              ) : null}
            </div>

            <label className="flex items-start gap-3 text-sm leading-snug">
              <input
                data-external-rights=""
                type="checkbox"
                checked={rights}
                onChange={(event) => setRights(event.target.checked)}
                className="mt-1 size-4 rounded border-white/30"
              />
              <span>{EXTERNAL_RIGHTS_COPY}</span>
            </label>

            {error ? (
              <p className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4 sm:flex-row sm:px-6">
            <a
              data-external-source-open=""
              href={sourceOpenHref(model)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-white/20 px-4 text-sm font-semibold"
              onClick={() => {
                // Keep session so same-tab return restores the modal.
                persistExternalQuoteContext(model);
              }}
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Kaynak sayfasını aç
            </a>
            <button
              type="button"
              data-external-file-pick=""
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-white/20 px-4 text-sm font-semibold"
              onClick={() => fileInputRef.current?.click()}
            >
              Dosya seç
            </button>
            <button
              type="button"
              data-external-continue=""
              disabled={!file || !rights}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-coral px-4 text-sm font-semibold text-light-text disabled:cursor-not-allowed disabled:opacity-40"
              onClick={continueToConfigurator}
            >
              Analize geç
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function dismissExternalQuoteSession() {
  clearExternalQuoteContext();
}
