import { COLOR_OPTIONS } from "@/domain/manufacturing/profiles";

export const PREVIEW_COLOR_HEX: Record<string, string> = {
  black: "#4a4450",
  white: "#efe8dc",
  gray: "#c4b8a8",
  orange: "#ff7a33",
};

export function previewColorHex(colorId: string): string {
  const match = COLOR_OPTIONS.find((option) => option.id === colorId);
  void match;
  return PREVIEW_COLOR_HEX[colorId] ?? PREVIEW_COLOR_HEX.black;
}
