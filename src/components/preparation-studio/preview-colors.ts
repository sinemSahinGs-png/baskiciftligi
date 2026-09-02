import { COLOR_OPTIONS } from "@/domain/manufacturing/profiles";

/** Studio default is a light metal so the mesh never disappears on a dark bed. */
export const STUDIO_DEFAULT_HEX = "#d5dbe3";

const PREVIEW_COLOR_HEX: Record<string, string> = {
  black: "#c8ced6",
  white: "#f3f6fa",
  gray: "#d5dbe3",
  orange: "#e8b48a",
};

export function previewColorHex(colorId: string): string {
  const match = COLOR_OPTIONS.find((option) => option.id === colorId);
  void match;
  return PREVIEW_COLOR_HEX[colorId] ?? STUDIO_DEFAULT_HEX;
}
