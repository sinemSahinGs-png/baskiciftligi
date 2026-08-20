"use client";

import { Controller, type Control, type UseFormRegister, type FieldErrors, type UseFormSetValue } from "react-hook-form";
import { Plus } from "lucide-react";

import { ProductMediaManager } from "@/components/admin/product-media-manager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategory, AdminCollection } from "@/domain/catalog/admin-types";
import type { ProductFormInput } from "@/lib/validation/catalog";

import { CollapsibleGroup, FieldError, MinorUnitInput, inputClass, selectClass, toDateTimeLocal } from "./form-primitives";

type AdvancedSettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: Control<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  categories: AdminCategory[];
  collections: AdminCollection[];
  canPublish: boolean;
  canViewCost: boolean;
  productId: string;
  mediaFields: ReturnType<typeof import("react-hook-form").useFieldArray<ProductFormInput, "media", "id">>;
  variantFields: ReturnType<typeof import("react-hook-form").useFieldArray<ProductFormInput, "variants", "id">>;
  personalizationFields: ReturnType<typeof import("react-hook-form").useFieldArray<ProductFormInput, "personalizationFields", "id">>;
  watchedName: string;
};

export function AdvancedSettings({
  open,
  onOpenChange,
  control,
  register,
  setValue,
  errors,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  categories: _categories,
  collections,
  canPublish,
  canViewCost,
  productId,
  mediaFields,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variantFields: _variantFields,
  personalizationFields,
  watchedName,
}: AdvancedSettingsProps) {
  return (
    <details
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      className="rounded-3xl border border-white/10 bg-card"
      data-testid="advanced-settings"
    >
      <summary className="cursor-pointer list-none px-5 py-4 text-base font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
        Gelişmiş ürün ayarları
      </summary>
      <div className="space-y-4 border-t border-white/10 p-5">
        <CollapsibleGroup title="SEO ve sosyal paylaşım">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO başlığı</Label>
              <Input id="seoTitle" {...register("seoTitle")} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO açıklaması</Label>
              <Textarea id="seoDescription" {...register("seoDescription")} rows={3} className="rounded-xl border-white/12 bg-black/20 px-3 py-3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input id="canonicalUrl" {...register("canonicalUrl")} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <input type="checkbox" {...register("searchVisible")} className="size-4 accent-cyan" />
              Aramada görünsün
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <input type="checkbox" {...register("noindex")} className="size-4 accent-cyan" />
              noindex
            </label>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup title="Barkod ve dahili kimlik">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="barcode">Barkod</Label>
              <Input id="barcode" {...register("barcode")} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelName">İç model adı</Label>
              <Input id="modelName" {...register("modelName")} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="themeStyle">Tema / stil</Label>
              <Input id="themeStyle" {...register("themeStyle")} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-advanced">Ana SKU</Label>
              <Input id="sku-advanced" {...register("sku")} className={inputClass} />
              <FieldError message={errors.sku?.message} />
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup title="Ölçüler ve teknik bilgiler">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weightGrams">Ağırlık (g)</Label>
              <Input id="weightGrams" type="number" {...register("weightGrams", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widthMm">Genişlik (mm)</Label>
              <Input id="widthMm" type="number" {...register("widthMm", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depthMm">Derinlik (mm)</Label>
              <Input id="depthMm" type="number" {...register("depthMm", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightMm">Yükseklik (mm)</Label>
              <Input id="heightMm" type="number" {...register("heightMm", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="materialSummary">Malzeme açıklaması</Label>
              <Textarea id="materialSummary" {...register("materialSummary")} rows={2} className="rounded-xl border-white/12 bg-black/20 px-3 py-3" />
            </div>
            {canViewCost ? (
              <div className="space-y-2">
                <Label htmlFor="costPriceMinor">Maliyet</Label>
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
              <select id="inventoryPolicy" {...register("inventoryPolicy")} className={selectClass}>
                <option value="deny">Stok bitince satışı durdur</option>
                <option value="continue">Stok bitince satmaya devam et</option>
              </select>
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup title="Kişiselleştirme alanları">
          <label className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <input type="checkbox" {...register("personalizationEnabled")} className="size-4 accent-cyan" />
            Kişiselleştirme açık
          </label>
          <div className="space-y-3">
            {personalizationFields.fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-white/10 p-3">
                <input type="hidden" {...register(`personalizationFields.${index}.id`)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input {...register(`personalizationFields.${index}.label`)} placeholder="Etiket" className={inputClass} />
                  <select {...register(`personalizationFields.${index}.type`)} className={selectClass}>
                    <option value="text">Metin</option>
                    <option value="initials">Baş harfler</option>
                    <option value="name">İsim</option>
                    <option value="date">Tarih</option>
                  </select>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                personalizationFields.append({
                  id: crypto.randomUUID(),
                  type: "text",
                  label: "Kişisel metin",
                  placeholder: "",
                  required: false,
                  helpText: "",
                })
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dashed border-cyan/35 px-4 text-sm font-semibold text-cyan"
            >
              <Plus className="size-4" />
              Alan ekle
            </button>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup title="Koleksiyonlar ve rozetler">
          <div className="grid gap-4 lg:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-semibold">Koleksiyonlar</legend>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-white/10 p-3">
                {collections.map((collection) => (
                  <label key={collection.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" value={collection.slug} {...register("collectionSlugs")} className="size-4 accent-cyan" />
                    {collection.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold">Rozetler</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {[["new", "Yeni"], ["bestseller", "Çok satan"], ["limited", "Sınırlı"]].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-xs">
                    <input type="checkbox" value={value} {...register("badges")} className="size-4 accent-cyan" />
                    {label}
                  </label>
                ))}
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs">
                <input type="checkbox" {...register("featured")} className="size-4 accent-cyan" />
                Vitrinde öne çıkar
              </label>
            </fieldset>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup title="Sahne / ürün kartı görünümü">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stage-preset">Sahne</Label>
              <select id="stage-preset" {...register("stagePreset")} className={selectClass}>
                <option value="">Kategoriden otomatik</option>
                <option value="cobalt">Kobalt</option>
                <option value="violet">Violet</option>
                <option value="coral">Mercan</option>
              </select>
            </div>
            <label className="flex items-center gap-2 self-end text-xs font-semibold">
              <input type="checkbox" {...register("isolated")} className="size-4 accent-cyan" />
              İzole ürün görseli
            </label>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup title="Gelişmiş medya (URL)">
          <ProductMediaManager
            productId={productId}
            fields={mediaFields.fields}
            mediaArray={mediaFields}
            register={register}
            setValue={setValue}
            watchedName={watchedName}
            errors={errors.media as never}
          />
        </CollapsibleGroup>

        {canPublish ? (
          <CollapsibleGroup title="Planlı yayınlama">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <select id="status" {...register("status")} className={selectClass}>
                  <option value="draft">Taslak</option>
                  <option value="scheduled">Planlandı</option>
                  <option value="active">Yayında</option>
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
                      value={toDateTimeLocal(field.value ?? "")}
                      onBlur={field.onBlur}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? new Date(event.target.value).toISOString()
                            : "",
                        )
                      }
                      className={`${inputClass} w-full`}
                    />
                  )}
                />
              </div>
            </div>
          </CollapsibleGroup>
        ) : null}
      </div>
    </details>
  );
}
