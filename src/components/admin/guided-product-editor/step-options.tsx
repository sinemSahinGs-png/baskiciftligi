"use client";

import { Plus, Trash2 } from "lucide-react";
import type { UseFieldArrayReturn, UseFormRegister, FieldErrors } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductFormInput } from "@/lib/validation/catalog";
import type { VariantMode } from "@/lib/catalog/prepare-product-save";

import { FieldError, StepPanel, inputClass } from "./form-primitives";

type StepOptionsProps = {
  variantMode: VariantMode;
  onVariantModeChange: (mode: VariantMode) => void;
  variantFields: UseFieldArrayReturn<ProductFormInput, "variants", "id">;
  register: UseFormRegister<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  showAdvancedVariants: boolean;
  onToggleAdvancedVariants: () => void;
};

export function StepOptions({
  variantMode,
  onVariantModeChange,
  variantFields,
  register,
  errors,
  showAdvancedVariants,
  onToggleAdvancedVariants,
}: StepOptionsProps) {
  return (
    <StepPanel
      stepId="editor-step-4"
      active
      title="Ürün seçenekleri"
      description="Çoğu ürün tek seçeneklidir. Renk, beden veya malzeme farkı varsa açın."
    >
      <div id="variant-mode" className="space-y-5">
        <p className="text-sm font-medium">
          Bu ürünün renk, boyut veya malzeme seçenekleri var mı?
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onVariantModeChange("single")}
            className={`min-h-11 rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
              variantMode === "single"
                ? "border-cyan/40 bg-cyan/10"
                : "border-white/10 bg-black/15"
            }`}
          >
            Tek seçenekli ürün
          </button>
          <button
            type="button"
            onClick={() => onVariantModeChange("multi")}
            className={`min-h-11 rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
              variantMode === "multi"
                ? "border-cyan/40 bg-cyan/10"
                : "border-white/10 bg-black/15"
            }`}
          >
            Renk / boyut / malzeme seçenekleri var
          </button>
        </div>

        {variantMode === "single" ? (
          <p
            className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
            data-testid="single-variant-ready"
          >
            Tek ürün seçeneği otomatik hazırlandı.
          </p>
        ) : (
          <div className="space-y-4">
            {variantFields.fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-2xl border border-white/10 bg-black/15 p-4"
              >
                <input type="hidden" {...register(`variants.${index}.id`)} />
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Seçenek {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => variantFields.remove(index)}
                    disabled={variantFields.fields.length === 1}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-destructive/20 px-3 text-xs font-semibold text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="size-3.5" />
                    Kaldır
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`variant-${index}-name`}>Ad</Label>
                    <Input
                      id={`variant-${index}-name`}
                      {...register(`variants.${index}.name`)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`variant-${index}-color`}>Renk</Label>
                    <Input
                      id={`variant-${index}-color`}
                      {...register(`variants.${index}.colorName`)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`variant-${index}-size`}>Boyut</Label>
                    <Input
                      id={`variant-${index}-size`}
                      {...register(`variants.${index}.sizeLabel`)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`variant-${index}-material`}>Malzeme</Label>
                    <Input
                      id={`variant-${index}-material`}
                      {...register(`variants.${index}.material`)}
                      className={inputClass}
                    />
                  </div>
                </div>
                {showAdvancedVariants ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`variant-${index}-sku`}>SKU</Label>
                      <Input
                        id={`variant-${index}-sku`}
                        {...register(`variants.${index}.sku`)}
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
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  variantFields.append({
                    name: `Seçenek ${variantFields.fields.length + 1}`,
                    sku: "",
                    colorName: "",
                    colorHex: "",
                    priceAdjustmentMinor: 0,
                    inventoryQuantity: 0,
                    isActive: true,
                  })
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-cyan/35 px-4 text-sm font-semibold text-cyan"
              >
                <Plus className="size-4" />
                Seçenek ekle
              </button>
              <button
                type="button"
                onClick={onToggleAdvancedVariants}
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm font-semibold"
              >
                {showAdvancedVariants
                  ? "Gelişmiş varyant ayarlarını gizle"
                  : "Gelişmiş varyant ayarları"}
              </button>
            </div>
            <FieldError
              message={
                typeof errors.variants?.message === "string"
                  ? errors.variants.message
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </StepPanel>
  );
}
