import type { ManufacturingTransform } from "@/domain/manufacturing/transform";
import { DEFAULT_MANUFACTURING_TRANSFORM } from "@/domain/manufacturing/transform";

const STORAGE_KEY = "bc-preparation-workspace-v1";

export interface PreparationSessionSnapshot {
  material: string;
  colorId: string;
  preset: "ekonomik" | "standart" | "detayli";
  infill: number;
  supports: "auto" | "on" | "off";
  quantity: number;
  technology: "FDM" | "SLA";
  transform: ManufacturingTransform;
  fileName: string | null;
  externalTitle: string | null;
}

export function loadPreparationSession(): PreparationSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PreparationSessionSnapshot;
  } catch {
    return null;
  }
}

export function savePreparationSession(snapshot: PreparationSessionSnapshot) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota errors
  }
}

export function clearPreparationSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function defaultSessionSnapshot(): PreparationSessionSnapshot {
  return {
    material: "PLA",
    colorId: "black",
    preset: "standart",
    infill: 20,
    supports: "auto",
    quantity: 1,
    technology: "FDM",
    transform: DEFAULT_MANUFACTURING_TRANSFORM,
    fileName: null,
    externalTitle: null,
  };
}
