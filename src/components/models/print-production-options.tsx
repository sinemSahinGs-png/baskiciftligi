"use client";

import { useEffect, useMemo } from "react";

import {
  PRINT_COLORS,
  PRINT_MATERIALS,
  PRINT_SIZE_PRESETS,
  type PrintSizePresetId,
} from "@/domain/external-models/production-estimate";
import { formatMoney } from "@/lib/money";

export interface ProductionOptionsValue {
  material: string;
  color: string;
  sizePreset: PrintSizePresetId;
  quantity: number;
}

export function PrintProductionOptions({
  value,
  onChange,
  onEstimate,
}: {
  value: ProductionOptionsValue;
  onChange: (next: ProductionOptionsValue) => void;
  onEstimate?: (grossMinor: number, disclaimerTr: string) => void;
}) {
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      size: value.sizePreset,
      quantity: String(value.quantity),
    });
    void fetch(`/api/hazir-modeller/estimate?${params}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((payload: { grossMinor?: number; disclaimerTr?: string }) => {
        if (payload.grossMinor != null && payload.disclaimerTr) {
          onEstimate?.(payload.grossMinor, payload.disclaimerTr);
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [value.sizePreset, value.quantity, onEstimate]);

  const sizeOptions = useMemo(
    () =>
      Object.entries(PRINT_SIZE_PRESETS).map(([id, preset]) => ({
        id: id as PrintSizePresetId,
        label: preset.label,
      })),
    [],
  );

  return (
    <div className="space-y-4" data-print-options="">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-light">Malzeme</span>
          <select
            value={value.material}
            onChange={(event) =>
              onChange({ ...value, material: event.target.value })
            }
            className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight/40 px-3"
          >
            {PRINT_MATERIALS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-light">Renk</span>
          <select
            value={value.color}
            onChange={(event) => onChange({ ...value, color: event.target.value })}
            className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight/40 px-3"
          >
            {PRINT_COLORS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-light">Boyut</span>
          <select
            value={value.sizePreset}
            onChange={(event) =>
              onChange({
                ...value,
                sizePreset: event.target.value as PrintSizePresetId,
              })
            }
            className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight/40 px-3"
          >
            {sizeOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-light">Adet</span>
          <input
            type="number"
            min={1}
            max={99}
            value={value.quantity}
            onChange={(event) =>
              onChange({
                ...value,
                quantity: Math.max(1, Math.min(99, Number(event.target.value) || 1)),
              })
            }
            className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight/40 px-3"
          />
        </label>
      </div>
    </div>
  );
}

export function EstimatedPriceBlock({
  grossMinor,
  disclaimerTr,
}: {
  grossMinor: number | null;
  disclaimerTr: string;
}) {
  if (grossMinor == null) return null;
  return (
    <div className="rounded-xl bg-white/[0.04] px-4 py-3" data-estimated-price="">
      <p className="text-xs uppercase tracking-wide text-muted-light">Tahmini fiyat</p>
      <p className="mt-1 font-heading text-3xl font-bold text-coral">
        {formatMoney(grossMinor)}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-light">{disclaimerTr}</p>
    </div>
  );
}
