"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import {
  ExternalLink,
  Eye,
  ImagePlus,
  LoaderCircle,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { saveProductAction } from "@/app/admin/actions";
import { ProductMediaManager } from "@/components/admin/product-media-manager";
import { ProductStage } from "@/components/catalog/product-stage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminCategory,
  AdminCollection,
} from "@/domain/catalog/admin-types";
import { slugifyTurkish } from "@/lib/catalog/slug";
import { formatMoney } from "@/lib/money";
import {
  productFormSchema,
  type ProductFormInput,
} from "@/lib/validation/catalog";
import { isStagePreset } from "@/domain/visual/stages";

interface ProductFormProps {
  initialValues: ProductFormInput;
  categories: AdminCategory[];
  collections: AdminCollection[];
  canWrite?: boolean;
  canPublish?: boolean;
  canViewCost?: boolean;
}

const inputClass =
  "h-11 rounded-xl border-white/12 bg-black/20 px-3 focus-visible:border-cyan";
const selectClass =
  "h-11 w-full rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm outline-none focus:border-cyan";

function slugify(value: string): string {
  return slugifyTurkish(value);
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-xs leading-5 text-destructive" role="alert">
      {message}
    </p>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-card p-5 sm:p-6">
      <div className="mb-6 border-b border-white/10 pb-5">
        <h2 className="font-heading text-xl font-medium tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function formatMinorInput(value: number | null): string {
  if (value === null) {
    return "";
  }

  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function parseMinorInput(value: string): number | null {
  const compact = value.trim().replace(/\s/g, "");

  if (!compact) {
    return null;
  }

  const normalized = compact.includes(",")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact;
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

function MinorUnitInput({
  id,
  value,
  onChange,
  onBlur,
  allowEmpty = false,
  describedBy,
}: {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur: () => void;
  allowEmpty?: boolean;
  describedBy?: string;
}) {
  const [displayValue, setDisplayValue] = useState(formatMinorInput(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDisplayValue(formatMinorInput(value));
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        aria-describedby={describedBy}
        className={`${inputClass} w-full pr-12 text-sm tabular outline-none`}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => {
          const next = event.target.value;
          setDisplayValue(next);
          const parsed = parseMinorInput(next);
          onChange(parsed ?? (allowEmpty ? null : 0));
        }}
        onBlur={() => {
          focused.current = false;
          const parsed = parseMinorInput(displayValue);
          const normalized = parsed ?? (allowEmpty ? null : 0);
          onChange(normalized);
          setDisplayValue(formatMinorInput(normalized));
          onBlur();
        }}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
        TRY
      </span>
    </div>
  );
}

function toDateTimeLocal(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function isDraftRecord(value: unknown): value is Partial<ProductFormInput> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function ProductForm({
  initialValues,
  categories,
  collections,
  canWrite = true,
  canPublish = false,
  canViewCost = false,
}: ProductFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(initialValues.slug));
  const [draftMessage, setDraftMessage] = useState(
    "Tarayıcı yerel taslağı hazır.",
  );
  const hydrated = useRef(false);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormInput>,
    defaultValues: initialValues,
    mode: "onBlur",
  });
  const mediaFields = useFieldArray({ control, name: "media" });
  const variantFields = useFieldArray({ control, name: "variants" });
  const personalizationFieldArray = useFieldArray({
    control,
    name: "personalizationFields",
  });
  const watchedValues = useWatch({ control });
  const storageKey = useMemo(
    () => `octo-admin-product-draft:${initialValues.id ?? "new"}`,
    [initialValues.id],
  );
  const watchedName = watchedValues.name ?? "";
  const watchedStatus = watchedValues.status ?? "draft";
  const watchedPrice = watchedValues.priceMinor ?? 0;
  const watchedMedia = watchedValues.media ?? [];
  const watchedStage = isStagePreset(watchedValues.stagePreset)
    ? watchedValues.stagePreset
    : "cobalt";
  const coverMedia =
    watchedMedia.find((item) => item?.role === "cover" || item?.role === "primary") ??
    watchedMedia[0];
  const hoverMedia = watchedMedia.find((item) => item?.role === "hover");
  const mobileMedia = watchedMedia.find((item) => item?.role === "mobile");
  const watchedVariantCount = watchedValues.variants?.length ?? 0;
  const watchedStock =
    watchedValues.variants?.reduce(
      (total, variant) => total + (variant?.inventoryQuantity ?? 0),
      0,
    ) ?? 0;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isDraftRecord(parsed)) {
          const restored: ProductFormInput = {
            ...initialValues,
            ...parsed,
            id: initialValues.id,
            media: Array.isArray(parsed.media)
              ? parsed.media
              : initialValues.media,
            variants: Array.isArray(parsed.variants)
              ? parsed.variants
              : initialValues.variants,
          };
          reset(restored, { keepDefaultValues: true });
          queueMicrotask(() => {
            setDraftMessage(
              "Bu tarayıcıdaki kaydedilmemiş taslak geri yüklendi.",
            );
          });
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
      queueMicrotask(() => {
        setDraftMessage("Bozuk tarayıcı taslağı temizlendi.");
      });
    } finally {
      hydrated.current = true;
    }
  }, [initialValues, reset, storageKey]);

  useEffect(() => {
    if (!hydrated.current || !isDirty) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(watchedValues));
      setDraftMessage(
        `Kaydedilmemiş taslak bu tarayıcıya yazıldı · ${new Date().toLocaleTimeString(
          "tr-TR",
          { hour: "2-digit", minute: "2-digit" },
        )}`,
      );
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [isDirty, storageKey, watchedValues]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  function clearBrowserDraft() {
    window.localStorage.removeItem(storageKey);
    reset(initialValues);
    setDraftMessage("Tarayıcı taslağı temizlendi.");
    toast.success("Tarayıcıdaki yerel taslak temizlendi.");
  }

  const [formErrorSummary, setFormErrorSummary] = useState("");

  function firstErrorMessage(errors: unknown, depth = 0): string | undefined {
    if (!errors || typeof errors !== "object" || depth > 8) {
      return undefined;
    }

    if (
      "message" in errors &&
      typeof errors.message === "string" &&
      errors.message.length > 0
    ) {
      return errors.message;
    }

    for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
      if (key === "ref" || key === "types") {
        continue;
      }
      const nested = firstErrorMessage(value, depth + 1);
      if (nested) {
        return `${key}: ${nested}`;
      }
    }

    return undefined;
  }

  function submit(values: ProductFormInput) {
    toast.dismiss();
    setSaveNotice(null);
    setFormErrorSummary("");
    const publishedAt =
      values.status === "active" && !values.publishedAt?.trim()
        ? new Date().toISOString()
        : values.publishedAt;
    const normalized: ProductFormInput = {
      ...values,
      publishedAt,
      compareAtPriceMinor:
        values.compareAtPriceMinor && values.compareAtPriceMinor > 0
          ? values.compareAtPriceMinor
          : null,
      media: values.media.map((media, index) => ({
        ...media,
        position: index,
      })),
    };

    startTransition(async () => {
      const result = await saveProductAction(normalized);

      if (result.status === "error" || !result.id) {
        setError("root", {
          type: "server",
          message: result.message ?? "Ürün kaydedilemedi.",
        });
        toast.error(result.message ?? "Ürün kaydedilemedi.");
        return;
      }

      window.localStorage.removeItem(storageKey);
      reset({ ...normalized, id: result.id, publishedAt });
      setDraftMessage("Sunucu kaydı güncel. Yerel taslak temizlendi.");
      setSaveNotice(result.message ?? "Ürün ve bağlı katalog kayıtları kaydedildi.");
      if (pathname !== `/admin/urunler/${result.id}`) {
        router.push(`/admin/urunler/${result.id}`);
      }
    });
  }

  const nameField = register("name");

  return (
    <form
      id="admin-product-form"
      onSubmit={handleSubmit(submit, (formErrors) => {
        const message =
          firstErrorMessage(formErrors) ?? "Ürün bilgilerini kontrol edin.";
        setFormErrorSummary(message);
        toast.error(message);
      })}
      noValidate
    >
      <div className="sticky top-[5.5rem] z-20 mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/95 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">
            Tarayıcı yerel taslağı
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {draftMessage} Bu veri yalnızca mevcut tarayıcıda tutulur; ekip
            üyeleriyle paylaşılmaz.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={clearBrowserDraft}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Yerel taslağı temizle
          </button>
          {initialValues.id ? (
            <Link
              href={`/admin/urunler/${initialValues.id}/onizleme`}
              target="_blank"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              Ön izleme
              <ExternalLink className="size-3" aria-hidden="true" />
            </Link>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-full border border-dashed border-white/15 px-4 text-xs text-muted-foreground">
              Ön izleme bağlantısı kayıttan sonra açılır
            </span>
          )}
          <button
            type="submit"
            disabled={pending || !canWrite}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan px-5 text-sm font-bold text-ink transition-colors hover:bg-[#63e2ff] disabled:pointer-events-none disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {pending ? "Kaydediliyor…" : "Ürünü kaydet"}
          </button>
        </div>
      </div>

      {saveNotice ? (
        <div
          className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200"
          role="status"
          data-testid="admin-save-success"
          data-saved-status={watchedStatus}
        >
          {saveNotice}
        </div>
      ) : null}

      {formErrorSummary ? (
        <div
          className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
          data-testid="admin-form-error"
        >
          {formErrorSummary}
        </div>
      ) : null}

      {errors.root?.message ? (
        <div
          className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          {errors.root.message}
        </div>
      ) : null}

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-5">
          <FormSection
            title="Temel bilgiler"
            description="Müşterinin gördüğü ürün kimliği ve açıklama içeriği."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Ürün adı</Label>
                <Input
                  id="name"
                  {...nameField}
                  className={inputClass}
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => {
                    nameField.onChange(event);
                    if (!slugWasEdited) {
                      setValue("slug", slugify(event.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  className={inputClass}
                  aria-invalid={Boolean(errors.slug)}
                  onChange={(event) => {
                    setSlugWasEdited(true);
                    setValue("slug", slugify(event.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <FieldError message={errors.slug?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">Ana SKU</Label>
                <Input
                  id="sku"
                  {...register("sku")}
                  className={inputClass}
                  aria-invalid={Boolean(errors.sku)}
                />
                <FieldError message={errors.sku?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barkod</Label>
                <Input
                  id="barcode"
                  {...register("barcode")}
                  className={inputClass}
                  placeholder="İsteğe bağlı"
                />
                <FieldError message={errors.barcode?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelName">İç model adı</Label>
                <Input
                  id="modelName"
                  {...register("modelName")}
                  className={inputClass}
                  placeholder="Atölye / üretim adı"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themeStyle">Tema / stil</Label>
                <Input
                  id="themeStyle"
                  {...register("themeStyle")}
                  className={inputClass}
                  placeholder="ör. minimal, endüstriyel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kind">Üretim modeli</Label>
                <select id="kind" {...register("kind")} className={selectClass}>
                  <option value="ready_stock">Hazır stok</option>
                  <option value="made_to_order">Sipariş üzerine üretim</option>
                  <option value="hybrid">Hibrit (stok + sipariş üzerine)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialCode">Malzeme</Label>
                <select
                  id="materialCode"
                  {...register("materialCode")}
                  className={selectClass}
                  onChange={(event) => {
                    const value = event.target.value;
                    setValue("materialCode", value as ProductFormInput["materialCode"], {
                      shouldDirty: true,
                    });
                    if (value === "PLA" && !watchedValues.materialSummary) {
                      setValue(
                        "materialSummary",
                        "3D üretim teknolojisiyle PLA plastik malzemeden özenle üretilmiştir.",
                        { shouldDirty: true },
                      );
                    }
                  }}
                >
                  <option value="">Seçilmedi</option>
                  <option value="PLA">PLA</option>
                  <option value="PETG">PETG</option>
                  <option value="TPU">TPU</option>
                  <option value="ASA">ASA</option>
                  <option value="ABS">ABS</option>
                  <option value="Resin">Reçine</option>
                  <option value="Other">Diğer</option>
                </select>
                <p className="text-xs leading-5 text-muted-foreground">
                  Malzeme cümlesi yalnızca seçildiğinde kaydedilir; varsayılan olarak kalın yazılmaz.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="materialSummary">Malzeme açıklaması</Label>
                <Textarea
                  id="materialSummary"
                  {...register("materialSummary")}
                  rows={3}
                  className="min-h-24 rounded-xl border-white/12 bg-black/20 px-3 py-3 font-normal"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shortDescription">Kısa açıklama</Label>
                <Textarea
                  id="shortDescription"
                  {...register("shortDescription")}
                  rows={3}
                  className="min-h-24 rounded-xl border-white/12 bg-black/20 px-3 py-3"
                  aria-invalid={Boolean(errors.shortDescription)}
                />
                <FieldError message={errors.shortDescription?.message} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Detaylı açıklama</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  rows={8}
                  className="min-h-52 rounded-xl border-white/12 bg-black/20 px-3 py-3"
                  aria-invalid={Boolean(errors.description)}
                />
                <FieldError message={errors.description?.message} />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Fiyat ve üretim süresi"
            description="Arayüz TRY gösterir; değerler sunucuya tam sayı kuruş olarak gönderilir."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priceMinor">Satış fiyatı</Label>
                <Controller
                  control={control}
                  name="priceMinor"
                  render={({ field }) => (
                    <MinorUnitInput
                      id="priceMinor"
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 0)}
                      onBlur={field.onBlur}
                      describedBy="price-help"
                    />
                  )}
                />
                <p id="price-help" className="text-xs text-muted-foreground">
                  Dahili değer: {watchedPrice} kuruş
                </p>
                <FieldError message={errors.priceMinor?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPriceMinor">
                  Karşılaştırma fiyatı
                </Label>
                <Controller
                  control={control}
                  name="compareAtPriceMinor"
                  render={({ field }) => (
                    <MinorUnitInput
                      id="compareAtPriceMinor"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      allowEmpty
                    />
                  )}
                />
                <FieldError message={errors.compareAtPriceMinor?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadMin">Asgari üretim günü</Label>
                <Input
                  id="leadMin"
                  type="number"
                  min={0}
                  max={365}
                  {...register("productionLeadTimeMinDays", {
                    valueAsNumber: true,
                  })}
                  className={inputClass}
                />
                <FieldError
                  message={errors.productionLeadTimeMinDays?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadMax">Azami üretim günü</Label>
                <Input
                  id="leadMax"
                  type="number"
                  min={0}
                  max={365}
                  {...register("productionLeadTimeMaxDays", {
                    valueAsNumber: true,
                  })}
                  className={inputClass}
                />
                <FieldError
                  message={errors.productionLeadTimeMaxDays?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRateBps">KDV (baz puan)</Label>
                <Input
                  id="vatRateBps"
                  type="number"
                  min={0}
                  max={10000}
                  {...register("vatRateBps", { valueAsNumber: true })}
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground">
                  2000 = %20. Para birimi TRY.
                </p>
              </div>
              {canViewCost ? (
                <div className="space-y-2">
                  <Label htmlFor="costPriceMinor">Maliyet (yalnız yönetici)</Label>
                  <Controller
                    control={control}
                    name="costPriceMinor"
                    render={({ field }) => (
                      <MinorUnitInput
                        id="costPriceMinor"
                        value={field.value ?? null}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        allowEmpty
                      />
                    )}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="inventoryPolicy">Stok politikası</Label>
                <select
                  id="inventoryPolicy"
                  {...register("inventoryPolicy")}
                  className={selectClass}
                >
                  <option value="deny">Stok bitince satışı durdur</option>
                  <option value="continue">Stok bitince satmaya devam et</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightGrams">Ağırlık (g)</Label>
                <Input
                  id="weightGrams"
                  type="number"
                  min={0}
                  {...register("weightGrams", { valueAsNumber: true })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="widthMm">Genişlik (mm)</Label>
                <Input
                  id="widthMm"
                  type="number"
                  min={0}
                  {...register("widthMm", { valueAsNumber: true })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depthMm">Derinlik (mm)</Label>
                <Input
                  id="depthMm"
                  type="number"
                  min={0}
                  {...register("depthMm", { valueAsNumber: true })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heightMm">Yükseklik (mm)</Label>
                <Input
                  id="heightMm"
                  type="number"
                  min={0}
                  {...register("heightMm", { valueAsNumber: true })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Vitrin sıra numarası</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  {...register("sortOrder", { valueAsNumber: true })}
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Sınıflandırma ve vitrin"
            description="Kategori, koleksiyon, rozet ve öne çıkarma seçenekleri."
          >
            <div className="grid gap-7 lg:grid-cols-2">
              <fieldset>
                <legend className="text-sm font-semibold">Kategoriler</legend>
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/15 p-3">
                  {categories.length ? (
                    categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex min-h-9 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm hover:bg-white/[0.04]"
                      >
                        <input
                          type="checkbox"
                          value={category.slug}
                          {...register("categorySlugs")}
                          className="size-4 accent-cyan"
                        />
                        <span className="flex-1">{category.name}</span>
                        <span className="text-[0.65rem] text-muted-foreground">
                          {category.productCount}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="p-2 text-xs text-muted-foreground">
                      Önce bir kategori oluşturun.
                    </p>
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold">Koleksiyonlar</legend>
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/15 p-3">
                  {collections.length ? (
                    collections.map((collection) => (
                      <label
                        key={collection.id}
                        className="flex min-h-9 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm hover:bg-white/[0.04]"
                      >
                        <input
                          type="checkbox"
                          value={collection.slug}
                          {...register("collectionSlugs")}
                          className="size-4 accent-cyan"
                        />
                        {collection.name}
                      </label>
                    ))
                  ) : (
                    <p className="p-2 text-xs text-muted-foreground">
                      Aktif koleksiyon bulunmuyor.
                    </p>
                  )}
                </div>
              </fieldset>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4">
                <input
                  type="checkbox"
                  {...register("featured")}
                  className="mt-0.5 size-4 accent-cyan"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    Vitrinde öne çıkar
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    Ana sayfa ve seçili katalog alanlarında öne çıkarma bayrağı.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4">
                <input
                  type="checkbox"
                  {...register("isolated")}
                  className="mt-0.5 size-4 accent-cyan"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    İzole ürün görseli
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    PNG/WebP şeffaf arka plan. İşaretli değilse görsel çerçeveli fotoğraf olarak gösterilir.
                  </span>
                </span>
              </label>
              <fieldset className="rounded-2xl border border-white/10 p-4">
                <legend className="px-1 text-sm font-semibold">
                  Ürün rozetleri
                </legend>
                <div className="mt-2 flex flex-wrap gap-4">
                  {[
                    ["new", "Yeni"],
                    ["bestseller", "Çok satan"],
                    ["limited", "Sınırlı"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"
                    >
                      <input
                        type="checkbox"
                        value={value}
                        {...register("badges")}
                        className="size-4 accent-cyan"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="stage-preset">Ürün sahnesi</Label>
                <select
                  id="stage-preset"
                  {...register("stagePreset")}
                  className={inputClass}
                >
                  <option value="">Kategoriden otomatik</option>
                  <option value="cobalt">Kobalt stüdyo</option>
                  <option value="violet">Violet stüdyo</option>
                  <option value="coral">Mercan stüdyo</option>
                  <option value="cyan">Camgöbeği stüdyo</option>
                  <option value="porcelain">Porselen stüdyo</option>
                  <option value="carbon">Karbon stüdyo</option>
                  <option value="orange">Erimiş turuncu</option>
                  <option value="split">İki renkli sahne</option>
                  <option value="technical">Teknik ızgara</option>
                  <option value="spectral">Yumuşak spektral</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="object-position">Görsel konumu</Label>
                <Input
                  id="object-position"
                  {...register("objectPosition")}
                  className={inputClass}
                  placeholder="50% 40%"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile-object-position">Mobil kırpım</Label>
                <Input
                  id="mobile-object-position"
                  {...register("mobileObjectPosition")}
                  className={inputClass}
                  placeholder="50% 30%"
                />
              </div>
              <div className="grid gap-4 md:col-span-2 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Masaüstü kart önizlemesi
                  </p>
                  <ProductStage
                    stage={watchedStage}
                    src={coverMedia?.url}
                    alt={coverMedia?.alt || watchedName || "Ürün"}
                    hoverSrc={hoverMedia?.url}
                    mobileSrc={mobileMedia?.url}
                    isolated={Boolean(watchedValues.isolated)}
                    objectPosition={
                      watchedValues.objectPosition || coverMedia?.objectPosition
                    }
                    mobileObjectPosition={
                      watchedValues.mobileObjectPosition ||
                      coverMedia?.mobileObjectPosition
                    }
                    ratio="standard"
                    className="rounded-2xl"
                  />
                </div>
                <div className="mx-auto w-full max-w-[18rem]">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Mobil kart önizlemesi
                  </p>
                  <ProductStage
                    stage={watchedStage}
                    src={mobileMedia?.url || coverMedia?.url}
                    alt={coverMedia?.alt || watchedName || "Ürün"}
                    isolated={Boolean(watchedValues.isolated)}
                    objectPosition={
                      watchedValues.mobileObjectPosition ||
                      watchedValues.objectPosition ||
                      "50% 30%"
                    }
                    ratio="standard"
                    className="rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Medya yöneticisi"
            description="Kapak, hover, galeri ve ölçü görsellerini yükleyin, sıralayın ve rol atayın. SVG kabul edilmez."
          >
            <ProductMediaManager
              productId={initialValues.id ?? "new-product"}
              fields={mediaFields.fields}
              mediaArray={mediaFields}
              register={register}
              setValue={setValue}
              watchedName={watchedName}
              errors={errors.media as never}
            />
          </FormSection>

          <FormSection
            title="Varyantlar ve stok"
            description="Her varyant için benzersiz SKU, renk, fiyat farkı ve eldeki stok kaydedilir."
          >
            <div className="space-y-4">
              {variantFields.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-2xl border border-white/10 bg-black/15 p-4"
                >
                  <input
                    type="hidden"
                    {...register(`variants.${index}.id`)}
                  />
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Varyant {index + 1}
                      {index === 0 ? " · varsayılan" : ""}
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => variantFields.move(index, index - 1)}
                        disabled={index === 0}
                        className="grid size-8 place-items-center rounded-full border border-white/10 disabled:opacity-30"
                        aria-label={`Varyant ${index + 1} yukarı`}
                      >
                        Yukarı
                      </button>
                      <button
                        type="button"
                        onClick={() => variantFields.remove(index)}
                        disabled={variantFields.fields.length === 1}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-destructive/20 px-3 text-xs font-semibold text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Kaldır
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-name`}>Ad</Label>
                      <Input
                        id={`variant-${index}-name`}
                        {...register(`variants.${index}.name`)}
                        className={inputClass}
                      />
                      <FieldError
                        message={errors.variants?.[index]?.name?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-sku`}>SKU</Label>
                      <Input
                        id={`variant-${index}-sku`}
                        {...register(`variants.${index}.sku`)}
                        className={inputClass}
                      />
                      <FieldError
                        message={errors.variants?.[index]?.sku?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-barcode`}>Barkod</Label>
                      <Input
                        id={`variant-${index}-barcode`}
                        {...register(`variants.${index}.barcode`)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-stock`}>Stok</Label>
                      <Input
                        id={`variant-${index}-stock`}
                        type="number"
                        min={0}
                        {...register(`variants.${index}.inventoryQuantity`, {
                          valueAsNumber: true,
                        })}
                        className={inputClass}
                      />
                      <FieldError
                        message={
                          errors.variants?.[index]?.inventoryQuantity?.message
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-color`}>
                        Renk adı
                      </Label>
                      <Input
                        id={`variant-${index}-color`}
                        {...register(`variants.${index}.colorName`)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-hex`}>Renk kodu</Label>
                      <Input
                        id={`variant-${index}-hex`}
                        {...register(`variants.${index}.colorHex`)}
                        className={inputClass}
                        placeholder="#21D4FD"
                      />
                      <FieldError
                        message={errors.variants?.[index]?.colorHex?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-size`}>Beden / ölçü</Label>
                      <Input
                        id={`variant-${index}-size`}
                        {...register(`variants.${index}.sizeLabel`)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-material`}>Varyant malzemesi</Label>
                      <Input
                        id={`variant-${index}-material`}
                        {...register(`variants.${index}.material`)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-adjustment`}>
                        Fiyat farkı (kuruş)
                      </Label>
                      <Input
                        id={`variant-${index}-adjustment`}
                        type="number"
                        {...register(
                          `variants.${index}.priceAdjustmentMinor`,
                          { valueAsNumber: true },
                        )}
                        className={inputClass}
                      />
                      <FieldError
                        message={
                          errors.variants?.[index]?.priceAdjustmentMinor?.message
                        }
                      />
                    </div>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <input
                      type="checkbox"
                      {...register(`variants.${index}.isActive`)}
                      className="size-4 accent-cyan"
                    />
                    Satışa açık varyant
                  </label>
                </div>
              ))}
              <FieldError
                message={
                  typeof errors.variants?.message === "string"
                    ? errors.variants.message
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() =>
                  variantFields.append({
                    name: `Seçenek ${variantFields.fields.length + 1}`,
                    sku: "",
                    barcode: "",
                    colorName: "",
                    colorHex: "",
                    priceAdjustmentMinor: 0,
                    inventoryQuantity: 0,
                    isActive: true,
                  })
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dashed border-cyan/35 px-4 text-sm font-semibold text-cyan hover:bg-cyan/5"
              >
                <Plus className="size-4" aria-hidden="true" />
                Varyant ekle
              </button>
            </div>
          </FormSection>

          <FormSection
            title="Kişiselleştirme"
            description="Müşteri sepete eklerken dolduracağı alanlar. Sunucu tekrar doğrular."
          >
            <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4">
              <input
                type="checkbox"
                {...register("personalizationEnabled")}
                className="mt-0.5 size-4 accent-cyan"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Kişiselleştirme açık
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Metin, isim, tarih veya yönetici tanımlı alanlar.
                </span>
              </span>
            </label>
            <div className="space-y-4">
              {personalizationFieldArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-2xl border border-white/10 bg-black/15 p-4"
                >
                  <input
                    type="hidden"
                    {...register(`personalizationFields.${index}.id`)}
                  />
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => personalizationFieldArray.remove(index)}
                      className="text-xs font-semibold text-destructive"
                    >
                      Alanı kaldır
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`pers-${index}-label`}>Etiket</Label>
                      <Input
                        id={`pers-${index}-label`}
                        {...register(`personalizationFields.${index}.label`)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pers-${index}-type`}>Tür</Label>
                      <select
                        id={`pers-${index}-type`}
                        {...register(`personalizationFields.${index}.type`)}
                        className={selectClass}
                      >
                        <option value="text">Özel metin</option>
                        <option value="initials">Baş harfler</option>
                        <option value="name">İsim</option>
                        <option value="date">Tarih</option>
                        <option value="color">Renk seçimi</option>
                        <option value="custom">Yönetici alanı</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pers-${index}-placeholder`}>
                        Yer tutucu
                      </Label>
                      <Input
                        id={`pers-${index}-placeholder`}
                        {...register(
                          `personalizationFields.${index}.placeholder`,
                        )}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pers-${index}-help`}>Yardım metni</Label>
                      <Input
                        id={`pers-${index}-help`}
                        {...register(`personalizationFields.${index}.helpText`)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pers-${index}-min`}>Asgari uzunluk</Label>
                      <Input
                        id={`pers-${index}-min`}
                        type="number"
                        min={0}
                        {...register(
                          `personalizationFields.${index}.minLength`,
                          { valueAsNumber: true },
                        )}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pers-${index}-max`}>Azami uzunluk</Label>
                      <Input
                        id={`pers-${index}-max`}
                        type="number"
                        min={1}
                        {...register(
                          `personalizationFields.${index}.maxLength`,
                          { valueAsNumber: true },
                        )}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <input
                      type="checkbox"
                      {...register(`personalizationFields.${index}.required`)}
                      className="size-4 accent-cyan"
                    />
                    Zorunlu alan
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  personalizationFieldArray.append({
                    id: crypto.randomUUID(),
                    type: "text",
                    label: "Kişisel metin",
                    placeholder: "",
                    required: false,
                    helpText: "",
                  })
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dashed border-cyan/35 px-4 text-sm font-semibold text-cyan hover:bg-cyan/5"
              >
                <Plus className="size-4" aria-hidden="true" />
                Kişiselleştirme alanı ekle
              </button>
            </div>
          </FormSection>

          <FormSection
            title="Yayın ve SEO"
            description="Yayın durumu, zamanlaması ve arama motoru metinleri."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <select
                  id="status"
                  {...register("status")}
                  className={selectClass}
                >
                  <option value="draft">Taslak</option>
                  {canPublish ? (
                    <>
                      <option value="scheduled">Planlandı</option>
                      <option value="active">Yayında</option>
                    </>
                  ) : null}
                  <option value="archived">Arşiv</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishedAt">Yayın zamanı</Label>
                <Controller
                  control={control}
                  name="publishedAt"
                  render={({ field }) => (
                    <input
                      id="publishedAt"
                      type="datetime-local"
                      value={toDateTimeLocal(field.value)}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const localValue = event.target.value;
                        field.onChange(
                          localValue
                            ? new Date(localValue).toISOString()
                            : "",
                        );
                      }}
                      className={`${inputClass} w-full text-sm outline-none`}
                    />
                  )}
                />
                <FieldError message={errors.publishedAt?.message} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="seoTitle">SEO başlığı</Label>
                <Input
                  id="seoTitle"
                  {...register("seoTitle")}
                  className={inputClass}
                  placeholder="Boşsa ürün adı kullanılır"
                />
                <p className="text-xs text-muted-foreground">
                  {(watchedValues.seoTitle ?? "").length}/60 önerilen karakter.
                  Daha uzun metin kaydedilir.
                </p>
                <FieldError message={errors.seoTitle?.message} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="seoDescription">SEO açıklaması</Label>
                <Textarea
                  id="seoDescription"
                  {...register("seoDescription")}
                  rows={4}
                  className="min-h-28 rounded-xl border-white/12 bg-black/20 px-3 py-3"
                  placeholder="Boşsa kısa açıklama kullanılır"
                />
                <p className="text-xs text-muted-foreground">
                  {(watchedValues.seoDescription ?? "").length}/160 önerilen
                  karakter. Daha uzun metin kaydedilir.
                </p>
                <FieldError message={errors.seoDescription?.message} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  {...register("canonicalUrl")}
                  className={inputClass}
                  placeholder="https://…"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  {...register("searchVisible")}
                  className="size-4 accent-cyan"
                />
                Aramada görünsün
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  {...register("noindex")}
                  className="size-4 accent-cyan"
                />
                noindex (taslak / gizli)
              </label>
            </div>
          </FormSection>
        </div>

        <aside className="space-y-5 2xl:sticky 2xl:top-24">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-card">
            <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_35%_25%,rgba(33,212,253,.18),transparent_38%),linear-gradient(145deg,#151b21,#0b0e12)] p-6">
              <div className="text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-black/25 text-cyan">
                  <ImagePlus className="size-6" aria-hidden="true" />
                </div>
                <p className="mt-3 max-w-52 truncate text-xs text-muted-foreground">
                  {watchedMedia[0]?.url || "İlk medya URL’si kapak olur"}
                </p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                  {watchedStatus === "active"
                    ? "Aktif"
                    : watchedStatus === "archived"
                      ? "Arşiv"
                      : "Taslak"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {watchedVariantCount} varyant
                </span>
              </div>
              <h2 className="mt-4 line-clamp-2 font-heading text-xl font-medium">
                {watchedName || "Adsız ürün"}
              </h2>
              <p className="mt-3 font-heading text-2xl text-cyan">
                {formatMoney(watchedPrice)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Toplam girilen stok: {watchedStock}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-card p-5">
            <h2 className="text-sm font-semibold">Yayın kontrolü</h2>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
              <li className="flex justify-between gap-3">
                <span>Ürün adı</span>
                <span className={watchedName ? "text-emerald-300" : "text-warm"}>
                  {watchedName ? "Hazır" : "Eksik"}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Medya</span>
                <span
                  className={
                    watchedMedia.length ? "text-emerald-300" : "text-warm"
                  }
                >
                  {watchedMedia.length ? `${watchedMedia.length} URL` : "Eksik"}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Varyant</span>
                <span
                  className={
                    watchedVariantCount ? "text-emerald-300" : "text-warm"
                  }
                >
                  {watchedVariantCount ? "Hazır" : "Eksik"}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Kaydedilmemiş değişiklik</span>
                <span className={isDirty ? "text-warm" : "text-emerald-300"}>
                  {isDirty ? "Var" : "Yok"}
                </span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </form>
  );
}
