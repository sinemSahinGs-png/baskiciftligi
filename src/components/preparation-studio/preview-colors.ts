import { COLOR_OPTIONS } from "@/domain/manufacturing/profiles";

export const PREVIEW_COLOR_HEX: Record<string, string> = {
  black: "#2a2f36",
  white: "#e8edf2",
  gray: "#8b949e",
  orange: "#f97316",
};

export function previewColorHex(colorId: string): string {
  const match = COLOR_OPTIONS.find((option) => option.id === colorId);
  void match;
  return PREVIEW_COLOR_HEX[colorId] ?? PREVIEW_COLOR_HEX.black;
}
