"use client";

import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductFormInput } from "@/lib/validation/catalog";

import { DEFAULT_VAT_BPS, LEAD_TIME_PRESETS } from "./constants";
import {
  FieldError,
  MinorUnitInput,
  StepPanel,
  inputClass,
} from "./form-primitives";

type StepPriceStockProps = {
  control: Control<ProductFormInput>;
  register: ReturnType<typeof import("react-hook-form").useForm<ProductFormInput>>["register"];
  errors: FieldErrors<ProductFormInput>;
  kind: ProductFormInput["kind"];
  onKindChange: (kind: ProductFormInput["kind"]) => void;
  leadPreset: string;
  onLeadPresetChange: (preset: string) => void;
};

export function StepPriceStock({
  control,
  register,
  errors,
  kind,
  onKindChange,
  leadPreset,
  onLeadPresetChange,
}: StepPriceStockProps) {
  const isStockProduct = kind === "ready_stock";
  const isCustomLead = leadPreset === "custom";

  return (
    <StepPanel
      stepId="editor-step-3"
      active
      title="Fiyat ve stok"
      description="Satış fiyatını girin. Ürün stoktan mı yoksa sipariş üzerine mi gideceğini seçin."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="priceMinor">Satış fiyatı</Label>
          <Controller
            control={control}
            name="priceMinor"
            render={({ field }) => (
              <MinorUnitInput
                id="priceMinor"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                allowEmpty
                errorId="priceMinor-error"
              />
            )}
          />
          <FieldError message={errors.priceMinor?.message} id="priceMinor-error" />
          <p className="text-xs text-muted-foreground">
            Düzenlerken 200 veya 249,90 yazabilirsiniz; kayıt kuruş cinsinden saklanır.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="compareAtPriceMinor">İndirimli / eski fiyat (isteğe bağlı)</Label>
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
          <Label htmlFor="vatRateBps">KDV oranı</Label>
          <Input
            id="vatRateBps"
            type="number"
            min={0}
            max={10000}
            defaultValue={DEFAULT_VAT_BPS}
            {...register("vatRateBps", { valueAsNumber: true })}
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground">2000 = %20 KDV</p>
        </div>

        <fieldset className="space-y-3 md:col-span-2" id="stock-mode">
          <legend className="text-sm font-semibold">Teslimat modeli</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-[88px] cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 has-checked:border-cyan/40 has-checked:bg-cyan/5 sm:min-h-[96px]">
              <input
                type="radio"
                name="stock-mode"
                checked={isStockProduct}
                onChange={() => onKindChange("ready_stock")}
                className="mt-1 size-4 accent-cyan"
              />
              <span>
                <span className="block text-sm font-semibold">Stoktan gönderim</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Hazır ürün; stok adedi zorunlu.
                </span>
              </span>
            </label>
            <label className="flex min-h-[88px] cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 has-checked:border-cyan/40 has-checked:bg-cyan/5 sm:min-h-[96px]">
              <input
                type="radio"
                name="stock-mode"
                checked={!isStockProduct}
                onChange={() => onKindChange("made_to_order")}
                className="mt-1 size-4 accent-cyan"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Sipariş üzerine üretim
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  3D baskı için doğal seçenek; stok gerekmez.
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        {isStockProduct ? (
          <div className="space-y-2 md:col-span-2" id="stock-quantity">
            <Label htmlFor="variant-0-stock">Stok adedi</Label>
            <Input
              id="variant-0-stock"
              type="number"
              min={0}
              {...register("variants.0.inventoryQuantity", { valueAsNumber: true })}
              className={inputClass}
            />
            <FieldError message={errors.variants?.[0]?.inventoryQuantity?.message} />
          </div>
        ) : (
          <div className="space-y-3 md:col-span-2" id="lead-time">
            <Label>Hazırlık süresi</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {LEAD_TIME_PRESETS.map((preset) => (
                <label
                  key={preset.label}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 py-2 has-checked:border-cyan/40 has-checked:bg-cyan/5"
                >
                  <input
                    type="radio"
                    name="lead-preset"
                    checked={
                      preset.min === null
                        ? isCustomLead
                        : leadPreset === `${preset.min}-${preset.max}`
                    }
                    onChange={() => {
                      if (preset.min === null) {
                        onLeadPresetChange("custom");
                        return;
                      }
                      onLeadPresetChange(`${preset.min}-${preset.max}`);
                    }}
                    className="size-4 accent-cyan"
                  />
                  <span className="text-sm font-medium">{preset.label}</span>
                </label>
              ))}
            </div>
            {isCustomLead ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="leadMin">Minimum gün</Label>
                  <Input
                    id="leadMin"
                    type="number"
                    min={0}
                    max={365}
                    {...register("productionLeadTimeMinDays", { valueAsNumber: true })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadMax">Maksimum gün</Label>
                  <Input
                    id="leadMax"
                    type="number"
                    min={0}
                    max={365}
                    {...register("productionLeadTimeMaxDays", { valueAsNumber: true })}
                    className={inputClass}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </StepPanel>
  );
}
