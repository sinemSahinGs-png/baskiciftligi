import type { ExternalProductionOptions } from "@/lib/models/external-quote-context";

const COLOR_MAP: Record<string, string> = {
  beyaz: "white",
  siyah: "black",
  gri: "gray",
};

const MATERIAL_MAP: Record<string, string> = {
  pla: "PLA",
  petg: "PETG",
  abs: "ABS",
};

const SIZE_SCALE: Record<string, number> = {
  kucuk: 80,
  orta: 100,
  buyuk: 160,
};

export function applyExternalProductionOptions(input: {
  material: (value: string) => void;
  colorId: (value: string) => void;
  scalePercent: (value: number) => void;
  quantity: (value: number) => void;
  options?: ExternalProductionOptions | null;
}) {
  if (!input.options) return;
  const material = MATERIAL_MAP[input.options.material.toLocaleLowerCase("tr-TR")];
  if (material) input.material(material);
  const color = COLOR_MAP[input.options.color.toLocaleLowerCase("tr-TR")];
  if (color) input.colorId(color);
  const scale = SIZE_SCALE[input.options.sizePreset.toLocaleLowerCase("tr-TR")];
  if (scale) input.scalePercent(scale);
  if (input.options.quantity >= 1) {
    input.quantity(Math.min(99, Math.floor(input.options.quantity)));
  }
}
