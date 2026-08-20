"use client";

import { LoaderCircle } from "lucide-react";

import type { GuidedEditorStep } from "@/lib/catalog/publication-checklist";

type ActionFooterProps = {
  currentStep: GuidedEditorStep;
  canWrite: boolean;
  canPublish: boolean;
  publishReady: boolean;
  pending: boolean;
  publishPending: boolean;
  publishSuccess: boolean;
  mediaUploading?: boolean;
  autosaveLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onCompleteMissing: () => void;
};

export function ActionFooter({
  currentStep,
  canWrite,
  canPublish,
  publishReady,
  pending,
  publishPending,
  publishSuccess,
  mediaUploading = false,
  autosaveLabel,
  onBack,
  onNext,
  onSaveDraft,
  onPublish,
  onCompleteMissing,
}: ActionFooterProps) {
  const isLastStep = currentStep === 5;
  const nextDisabled = pending || publishPending || mediaUploading;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-6"
      data-testid="editor-action-footer"
    >
      <p className="mx-auto mb-2 max-w-7xl text-xs text-muted-foreground">
        {autosaveLabel}
      </p>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={currentStep === 1 || pending || publishPending}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 px-4 text-sm font-semibold disabled:opacity-40"
          >
            Geri
          </button>
          {!isLastStep ? (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/10 px-5 text-sm font-semibold hover:bg-white/15 disabled:opacity-40"
            >
              İleri
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={!canWrite || pending || publishPending || mediaUploading}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold disabled:opacity-40"
          >
            {pending ? "Kaydediliyor…" : "Taslak olarak kaydet"}
          </button>

          {isLastStep && canPublish ? (
            <button
              type="button"
              onClick={publishReady ? onPublish : onCompleteMissing}
              disabled={publishPending || publishSuccess || mediaUploading}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan px-5 text-sm font-bold text-ink disabled:opacity-50"
              data-testid="publish-product-button"
            >
              {publishSuccess ? (
                "Ürün yayınlandı"
              ) : publishPending ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Yayınlanıyor…
                </>
              ) : publishReady ? (
                "Ürünü yayınla"
              ) : (
                "Eksikleri tamamla"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
