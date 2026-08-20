"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { Eye, ExternalLink, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  saveProductAction,
  suggestProductSkuAction,
} from "@/app/admin/actions";
import type {
  AdminCategory,
  AdminCollection,
} from "@/domain/catalog/admin-types";
import { slugifyTurkish } from "@/lib/catalog/slug";
import type { VariantMode } from "@/lib/catalog/prepare-product-save";
import {
  assessPublicationReadiness,
  type GuidedEditorStep,
  type PublicationChecklistItem,
} from "@/lib/catalog/publication-checklist";
import {
  productFormSchema,
  type ProductFormInput,
} from "@/lib/validation/catalog";

import { AdvancedSettings } from "./advanced-settings";
import { ActionFooter } from "./action-footer";
import {
  draftMetaStorageKey,
  editorStorageKey,
  inspectStoredDraft,
  LEAD_TIME_PRESETS,
  type StoredDraftEnvelope,
} from "./constants";
import { DraftConflictBanner } from "./draft-conflict-banner";
import { PublishSuccessParticles } from "./publish-success-particles";
import { StepBasics } from "./step-basics";
import { StepMediaCategory } from "./step-media-category";
import { StepOptions } from "./step-options";
import { StepPriceStock } from "./step-price-stock";
import { StepReview } from "./step-review";
import { MobileProgressBar, StepRail } from "./step-rail";
import { StorefrontPreviewCard } from "./storefront-preview-card";

export interface GuidedProductEditorProps {
  initialValues: ProductFormInput;
  categories: AdminCategory[];
  collections: AdminCollection[];
  serverRevisionAt?: string;
  canWrite?: boolean;
  canPublish?: boolean;
  canViewCost?: boolean;
}

function inferLeadPreset(values: ProductFormInput): string {
  const match = LEAD_TIME_PRESETS.find(
    (preset) =>
      preset.min !== null &&
      preset.min === values.productionLeadTimeMinDays &&
      preset.max === values.productionLeadTimeMaxDays,
  );
  return match ? `${match.min}-${match.max}` : "custom";
}

export function GuidedProductEditor({
  initialValues,
  categories,
  collections,
  serverRevisionAt,
  canWrite = true,
  canPublish = false,
  canViewCost = false,
}: GuidedProductEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const revisionAt =
    serverRevisionAt ?? initialValues.publishedAt ?? new Date(0).toISOString();

  const [currentStep, setCurrentStep] = useState<GuidedEditorStep>(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<GuidedEditorStep>>(
    () => new Set([1]),
  );
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(initialValues.slug));
  const [variantMode, setVariantMode] = useState<VariantMode>(
    initialValues.variants.length > 1 ? "multi" : "single",
  );
  const [showAdvancedSku] = useState(false);
  const [showAdvancedVariants, setShowAdvancedVariants] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [draftPending, startDraftTransition] = useTransition();
  const [publishPending, startPublishTransition] = useTransition();
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [formErrorSummary, setFormErrorSummary] = useState("");
  const [autosaveState, setAutosaveState] = useState<
    "idle" | "dirty" | "saving" | "saved"
  >("idle");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [leadPreset, setLeadPreset] = useState(() => inferLeadPreset(initialValues));
  const [draftConflict, setDraftConflict] = useState<StoredDraftEnvelope | null>(
    () => {
      if (typeof window === "undefined") {
        return null;
      }
      try {
        const inspection = inspectStoredDraft(
          editorStorageKey(initialValues.id),
          revisionAt,
          initialValues.priceMinor ?? null,
        );
        if (inspection.kind === "conflict") {
          return inspection.envelope;
        }
      } catch {
        // ignore
      }
      return null;
    },
  );

  const hydrated = useRef(false);
  const serverRevisionMs = useRef(Date.parse(revisionAt) || 0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    getValues,
    formState: { errors, isDirty },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormInput>,
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const mediaFields = useFieldArray({ control, name: "media" });
  const variantFields = useFieldArray({ control, name: "variants" });
  const personalizationFields = useFieldArray({
    control,
    name: "personalizationFields",
  });
  const watchedValues = useWatch({ control });
  const storageKey = editorStorageKey(initialValues.id);
  const metaKey = draftMetaStorageKey(initialValues.id);

  const checklistValues = useMemo(
    (): ProductFormInput => ({
      ...initialValues,
      ...(watchedValues as ProductFormInput),
      media: (watchedValues.media ?? initialValues.media) as ProductFormInput["media"],
      variants: (watchedValues.variants ?? initialValues.variants) as ProductFormInput["variants"],
      categorySlugs: watchedValues.categorySlugs ?? initialValues.categorySlugs,
      priceMinor:
        watchedValues.priceMinor === undefined
          ? initialValues.priceMinor
          : watchedValues.priceMinor,
    }),
    [initialValues, watchedValues],
  );

  const readiness = assessPublicationReadiness(checklistValues);
  const categoryName = categories.find((item) =>
    checklistValues.categorySlugs.includes(item.slug),
  )?.name;

  useEffect(() => {
    serverRevisionMs.current = Date.parse(revisionAt) || 0;
  }, [revisionAt]);

  useEffect(() => {
    try {
      const inspection = inspectStoredDraft(storageKey, revisionAt, initialValues.priceMinor ?? null);
      if (inspection.kind === "restore") {
        reset({ ...initialValues, ...inspection.draft });
        toast.message("Kaydedilmemiş yerel taslak geri yüklendi.");
      }
    } catch {
      // ignore corrupt drafts
    } finally {
      hydrated.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  useEffect(() => {
    if (!hydrated.current || !isDirty) {
      return;
    }
    setUnsavedChanges(true);
    setAutosaveState("dirty");
    const timer = window.setTimeout(() => {
      setAutosaveState("saving");
      try {
        const values = getValues();
        const envelope: StoredDraftEnvelope = {
          draft: values,
          savedAt: Date.now(),
          serverRevisionAt: revisionAt,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(envelope));
        window.localStorage.setItem(metaKey, String(envelope.savedAt));
        setAutosaveState("saved");
      } catch {
        setAutosaveState("dirty");
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [getValues, isDirty, metaKey, revisionAt, storageKey, watchedValues]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (unsavedChanges && autosaveState !== "saved") {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [autosaveState, unsavedChanges]);

  const autosaveLabel = useMemo(() => {
    switch (autosaveState) {
      case "dirty":
        return "Kaydedilmemiş değişiklik";
      case "saving":
        return "Yerel taslak kaydediliyor…";
      case "saved":
        return "Yerel taslak kaydedildi";
      default:
        return saveNotice ? "Sunucu kaydı güncel" : "Tüm değişiklikler güncel";
    }
  }, [autosaveState, saveNotice]);

  const goToStep = useCallback((step: GuidedEditorStep) => {
    setCurrentStep(step);
    setVisitedSteps((previous) => new Set([...previous, step]));
  }, []);

  const focusField = useCallback((fieldId?: string) => {
    if (!fieldId) {
      return;
    }
    window.setTimeout(() => {
      const element = document.getElementById(fieldId);
      element?.focus();
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

  const handleChecklistSelect = useCallback(
    (item: PublicationChecklistItem) => {
      goToStep(item.step);
      focusField(item.fieldId);
    },
    [focusField, goToStep],
  );

  const handleCompleteMissing = useCallback(() => {
    const firstMissing = readiness.items.find((item) => !item.satisfied);
    if (firstMissing) {
      handleChecklistSelect(firstMissing);
    } else {
      goToStep(1);
    }
  }, [goToStep, handleChecklistSelect, readiness.items]);

  const handleNameChange = useCallback(
    (name: string) => {
      if (!slugWasEdited) {
        setValue("slug", slugifyTurkish(name), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [setValue, slugWasEdited],
  );

  const refreshSuggestedSku = useCallback(
    (categorySlugs: string[]) => {
      void suggestProductSkuAction({
        categorySlugs,
        excludeProductId: initialValues.id,
      }).then((result) => {
        if (result.sku && !showAdvancedSku && !getValues("sku")?.trim()) {
          setValue("sku", result.sku, { shouldDirty: true });
          if (variantMode === "single") {
            setValue("variants.0.sku", result.sku, { shouldDirty: true });
          }
        }
      });
    },
    [getValues, initialValues.id, setValue, showAdvancedSku, variantMode],
  );

  const handleSelectPrimary = useCallback(
    (slug: string) => {
      const current = getValues("categorySlugs") ?? [];
      const additional = current.slice(1).filter((item) => item !== slug);
      const next = [slug, ...additional];
      setValue("categorySlugs", next, {
        shouldDirty: true,
        shouldValidate: true,
      });
      refreshSuggestedSku(next);
    },
    [getValues, refreshSuggestedSku, setValue],
  );

  const handleToggleAdditional = useCallback(
    (slug: string) => {
      const current = getValues("categorySlugs") ?? [];
      const primary = current[0];
      if (!primary) {
        handleSelectPrimary(slug);
        return;
      }
      const rest = current.slice(1);
      const nextRest = rest.includes(slug)
        ? rest.filter((item) => item !== slug)
        : [...rest, slug];
      const next = [primary, ...nextRest];
      setValue("categorySlugs", next, { shouldDirty: true, shouldValidate: true });
      refreshSuggestedSku(next);
    },
    [getValues, handleSelectPrimary, refreshSuggestedSku, setValue],
  );

  const handleLeadPresetChange = useCallback(
    (preset: string) => {
      setLeadPreset(preset);
      const selected = LEAD_TIME_PRESETS.find(
        (item) =>
          item.min !== null && `${item.min}-${item.max}` === preset,
      );
      if (selected && selected.min !== null && selected.max !== null) {
        setValue("productionLeadTimeMinDays", selected.min, { shouldDirty: true });
        setValue("productionLeadTimeMaxDays", selected.max, { shouldDirty: true });
      }
    },
    [setValue],
  );

  const resolveDraftConflict = useCallback(
    (source: "server" | "local") => {
      if (!draftConflict) {
        return;
      }
      if (source === "server") {
        window.localStorage.removeItem(storageKey);
        reset(initialValues);
      } else {
        reset({ ...initialValues, ...draftConflict.draft });
      }
      setDraftConflict(null);
      setUnsavedChanges(false);
      setAutosaveState("idle");
    },
    [draftConflict, initialValues, reset, storageKey],
  );

  const persist = useCallback(
    (intent: "draft" | "publish") => {
      if (intent === "publish" && !readiness.ready) {
        setFormErrorSummary("Yayınlamak için eksik maddeleri tamamlayın.");
        goToStep(5);
        handleCompleteMissing();
        return;
      }

      const values = getValues();
      const payload: ProductFormInput = {
        ...values,
        status: intent === "publish" ? "active" : "draft",
        media: values.media.map((media, index) => ({ ...media, position: index })),
      };

      const run = intent === "publish" ? startPublishTransition : startDraftTransition;

      run(async () => {
        setFormErrorSummary("");
        setSaveNotice(null);
        const result = await saveProductAction(payload, {
          intent,
          variantMode,
        });

        if (result.status === "error" || !result.id) {
          const message = result.message ?? "Ürün kaydedilemedi.";
          setFormErrorSummary(message);
          setError("root", { type: "server", message });
          toast.error(message);
          if (intent === "publish") {
            goToStep(5);
            handleCompleteMissing();
          }
          return;
        }

        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem(metaKey);
        serverRevisionMs.current = Date.now();
        const nextValues = {
          ...payload,
          id: result.id,
          status: intent === "publish" ? ("active" as const) : ("draft" as const),
        };
        reset(nextValues);
        setUnsavedChanges(false);
        setAutosaveState("idle");
        setSaveNotice(result.message ?? null);
        toast.success(result.message ?? "Kaydedildi");

        if (intent === "publish") {
          setPublishSuccess(true);
          setPublishedSlug(nextValues.slug);
        }

        if (pathname !== `/admin/urunler/${result.id}`) {
          router.push(`/admin/urunler/${result.id}`);
        }
      });
    },
    [
      getValues,
      goToStep,
      handleCompleteMissing,
      metaKey,
      pathname,
      readiness.ready,
      reset,
      router,
      setError,
      storageKey,
      variantMode,
    ],
  );

  return (
    <>
      <PublishSuccessParticles active={publishSuccess} />
      <MobileProgressBar
        currentStep={currentStep}
        completionPercent={readiness.completionPercent}
      />

      {draftConflict ? (
        <DraftConflictBanner
          localPriceMinor={draftConflict.draft.priceMinor ?? null}
          serverPriceMinor={initialValues.priceMinor ?? null}
          localSavedAt={draftConflict.savedAt}
          serverUpdatedAt={revisionAt}
          onUseServer={() => resolveDraftConflict("server")}
          onUseLocal={() => resolveDraftConflict("local")}
        />
      ) : null}

      <form
        id="admin-product-form"
        className={`pb-32 ${autosaveState === "saved" ? "editor-autosave-pulse" : ""}`}
        onSubmit={handleSubmit(() => undefined)}
        noValidate
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card/80 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            {autosaveLabel}
            {saveNotice ? (
              <span
                className="ml-2 text-emerald-300"
                data-testid="admin-save-success"
              >
                {saveNotice}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {initialValues.id ? (
              <Link
                href={`/admin/urunler/${initialValues.id}/onizleme`}
                target="_blank"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold"
              >
                <Eye className="size-3.5" />
                Ön izleme
                <ExternalLink className="size-3" />
              </Link>
            ) : null}
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-xs font-semibold lg:hidden"
              onClick={() => setPreviewSheetOpen(true)}
            >
              Önizlemeyi aç
            </button>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
          <StepRail
            currentStep={currentStep}
            completionPercent={readiness.completionPercent}
            onStepSelect={goToStep}
            visitedSteps={visitedSteps}
          />

          <div className="min-w-0 space-y-5">
            {currentStep === 1 ? (
              <StepBasics
                register={register}
                errors={errors}
                slugWasEdited={slugWasEdited}
                onSlugEdited={() => setSlugWasEdited(true)}
                onNameChange={handleNameChange}
                shortDescriptionValue={checklistValues.shortDescription}
                descriptionValue={checklistValues.description}
                slugValue={checklistValues.slug}
              />
            ) : null}
            {currentStep === 2 ? (
              <StepMediaCategory
                productId={initialValues.id ?? "new-product"}
                categories={categories}
                categorySlugs={checklistValues.categorySlugs}
                onSelectPrimary={handleSelectPrimary}
                onToggleAdditional={handleToggleAdditional}
                fields={mediaFields.fields}
                mediaArray={mediaFields}
                setValue={setValue}
                watchedName={checklistValues.name}
                previewValues={checklistValues}
                onUploadingChange={setMediaUploading}
              />
            ) : null}
            {currentStep === 3 ? (
              <StepPriceStock
                control={control}
                register={register}
                errors={errors}
                kind={checklistValues.kind}
                onKindChange={(kind) =>
                  setValue("kind", kind, { shouldDirty: true, shouldValidate: true })
                }
                leadPreset={leadPreset}
                onLeadPresetChange={handleLeadPresetChange}
              />
            ) : null}
            {currentStep === 4 ? (
              <StepOptions
                variantMode={variantMode}
                onVariantModeChange={setVariantMode}
                variantFields={variantFields}
                register={register}
                errors={errors}
                showAdvancedVariants={showAdvancedVariants}
                onToggleAdvancedVariants={() =>
                  setShowAdvancedVariants((value) => !value)
                }
              />
            ) : null}
            {currentStep === 5 ? (
              <StepReview
                values={checklistValues}
                categories={categories}
                checklistItems={readiness.items}
                onChecklistSelect={handleChecklistSelect}
                publishReady={readiness.ready}
                errorMessage={formErrorSummary || errors.root?.message}
                publishedSlug={publishedSlug}
                publishSuccess={publishSuccess}
              />
            ) : null}

            <AdvancedSettings
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              categories={categories}
              collections={collections}
              canPublish={canPublish}
              canViewCost={canViewCost}
              productId={initialValues.id ?? "new-product"}
              mediaFields={mediaFields}
              variantFields={variantFields}
              personalizationFields={personalizationFields}
              watchedName={checklistValues.name}
            />
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <StorefrontPreviewCard
                values={checklistValues}
                categoryName={categoryName}
              />
            </div>
          </aside>
        </div>
      </form>

      {previewSheetOpen ? (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Mağaza önizlemesi</p>
              <button
                type="button"
                className="min-h-11 rounded-full border border-white/15 px-4 text-sm font-semibold"
                onClick={() => setPreviewSheetOpen(false)}
              >
                Kapat
              </button>
            </div>
            <StorefrontPreviewCard values={checklistValues} categoryName={categoryName} />
          </div>
        </div>
      ) : null}

      <ActionFooter
        currentStep={currentStep}
        canWrite={canWrite}
        canPublish={canPublish}
        publishReady={readiness.ready}
        pending={draftPending}
        publishPending={publishPending}
        publishSuccess={publishSuccess}
        mediaUploading={mediaUploading}
        autosaveLabel={autosaveLabel}
        onBack={() => goToStep(Math.max(1, currentStep - 1) as GuidedEditorStep)}
        onNext={() => goToStep(Math.min(5, currentStep + 1) as GuidedEditorStep)}
        onSaveDraft={() => persist("draft")}
        onPublish={() => persist("publish")}
        onCompleteMissing={handleCompleteMissing}
      />

      {(draftPending || publishPending) && (
        <div className="pointer-events-none fixed top-24 right-6 z-40 rounded-full border border-white/10 bg-card px-3 py-2 text-xs">
          <LoaderCircle className="inline size-3.5 animate-spin" /> Kaydediliyor…
        </div>
      )}
    </>
  );
}

export { GuidedProductEditor as ProductForm };
