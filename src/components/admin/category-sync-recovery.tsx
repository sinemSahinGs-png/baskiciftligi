"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  previewSyncCanonicalCategoriesAction,
  syncCanonicalCategoriesAction,
} from "@/app/admin/actions";

type PreviewDecision = {
  slug: string;
  operation: string;
  imageUrl: string;
};

export function CategorySyncRecovery() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{
    created: number;
    updated: number;
    skipped: number;
    decisions: PreviewDecision[];
  } | null>(null);

  function runPreview() {
    startTransition(async () => {
      const result = await previewSyncCanonicalCategoriesAction();
      if (result.status === "error") {
        toast.error(result.message ?? "Önizleme başarısız.");
        setPreview(null);
        return;
      }

      setPreview({
        created: result.created ?? 0,
        updated: result.updated ?? 0,
        skipped: result.skipped ?? 0,
        decisions: result.decisions ?? [],
      });
      toast.success("Senkronizasyon önizlemesi hazır.");
    });
  }

  function runSync() {
    if (
      !window.confirm(
        "Kanonical kategoriler Supabase'e yazılsın mı? Mevcut kayıtlar silinmez; yalnızca eksik alanlar doldurulur veya yayın durumu düzeltilir.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await syncCanonicalCategoriesAction({ confirmed: true });
      if (result.status === "error") {
        toast.error(result.message ?? "Senkronizasyon başarısız.");
        return;
      }

      toast.success(result.message);
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <section className="mb-5 rounded-2xl border border-cyan/20 bg-cyan/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <p className="text-[0.65rem] font-bold tracking-[0.13em] text-cyan uppercase">
            Kurtarma
          </p>
          <h2 className="font-heading text-lg font-medium">
            Kategorileri senkronize et
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Vitrinde görünen kanonik kategori taksonomisini Supabase&apos;e
            yazar. Mevcut kapak görselleri korunur; hiçbir kategori otomatik
            silinmez. Önce önizleyin, sonra onaylayın.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runPreview}
            disabled={pending}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-xs font-semibold text-foreground hover:bg-white/5 disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Önizle
          </button>
          <button
            type="button"
            onClick={runSync}
            disabled={pending || !preview}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan px-4 text-xs font-bold text-ink hover:bg-[#63e2ff] disabled:opacity-50"
          >
            Senkronize et
          </button>
        </div>
      </div>

      {preview ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
          <p className="font-semibold">
            {preview.created} oluşturulacak · {preview.updated} güncellenecek ·{" "}
            {preview.skipped} atlanacak
          </p>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-muted-foreground">
            {preview.decisions.map((decision) => (
              <li key={decision.slug} className="font-mono">
                {decision.operation.padEnd(6)} {decision.slug} ·{" "}
                {decision.imageUrl}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
