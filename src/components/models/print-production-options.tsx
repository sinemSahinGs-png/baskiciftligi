"use client";

import {
  PRINT_COLORS,
  PRINT_MATERIALS,
  PRINT_SIZE_PRESETS,
  type PrintSizePresetId,
} from "@/domain/external-models/production-estimate";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

export interface ProductionOptionsValue {
  material: string;
  color: string;
  sizePreset: PrintSizePresetId;
  quantity: number;
}

const fieldClass =
  "min-h-12 w-full rounded-lg border border-white/15 bg-midnight/40 px-3 text-base";

export function PrintProductionOptions({
  value,
  onChange,
}: {
  value: ProductionOptionsValue;
  onChange: (next: ProductionOptionsValue) => void;
}) {
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
      <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-sm text-muted-light">Malzeme</span>
          <select
            value={value.material}
            onChange={(event) =>
              onChange({ ...value, material: event.target.value })
            }
            className={fieldClass}
          >
            {PRINT_MATERIALS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-sm text-muted-light">Renk</span>
          <select
            value={value.color}
            onChange={(event) => onChange({ ...value, color: event.target.value })}
            className={fieldClass}
          >
            {PRINT_COLORS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-sm text-muted-light">Boyut</span>
          <select
            value={value.sizePreset}
            onChange={(event) =>
              onChange({
                ...value,
                sizePreset: event.target.value as PrintSizePresetId,
              })
            }
            className={fieldClass}
          >
            {sizeOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className={cn("block text-sm", "min-[390px]:col-span-1")}>
          <span className="mb-1.5 block text-sm text-muted-light">Adet</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={value.quantity}
            onChange={(event) =>
              onChange({
                ...value,
                quantity: Math.max(1, Math.min(99, Number(event.target.value) || 1)),
              })
            }
            className={fieldClass}
          />
        </label>
      </div>
    </div>
  );
}
