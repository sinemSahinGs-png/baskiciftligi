import { createHash } from "node:crypto";

import type {
  MaterialProfile,
  PrinterProfile,
  QualityProfile,
} from "@/domain/manufacturing/types";

export const PRINTER_PROFILE_SLUG = "bambu-a1-dev";

export const DEVELOPMENT_PRINTER: PrinterProfile = {
  id: "printer-bambu-a1-dev",
  name: "Bambu Lab A1 uyumlu (geliştirme)",
  slug: PRINTER_PROFILE_SLUG,
  manufacturer: "Bambu Lab",
  model: "A1-compatible development profile",
  technology: "FDM",
  buildVolumeMm: { x: 256, y: 256, z: 256 },
  nozzleDiameterMm: 0.4,
  filamentDiameterMm: 1.75,
  slicerProfileFile: "printer/bambu-a1-dev.ini",
  version: 1,
  checksum: "",
  isActive: true,
  isDevelopmentSeed: true,
  notes:
    "Yalnız geliştirme ve yerel dilimleme içindir. Her modelin her makineye sığdığı iddia edilmez.",
};

export const MATERIAL_PROFILES: MaterialProfile[] = [
  {
    id: "pla",
    name: "PLA",
    densityGPerCm3: 1.24,
    slicerProfileFile: "filament/pla.ini",
    version: 1,
    checksum: "",
    isActive: true,
  },
];

export const QUALITY_PROFILES: QualityProfile[] = [
  {
    id: "ekonomik",
    name: "Ekonomik",
    layerHeightMm: 0.28,
    defaultInfillPercent: 15,
    slicerProfileFile: "print/ekonomik.ini",
    version: 1,
    checksum: "",
  },
  {
    id: "standart",
    name: "Standart",
    layerHeightMm: 0.2,
    defaultInfillPercent: 20,
    slicerProfileFile: "print/standart.ini",
    version: 1,
    checksum: "",
  },
  {
    id: "detayli",
    name: "Detaylı",
    layerHeightMm: 0.12,
    defaultInfillPercent: 20,
    slicerProfileFile: "print/detayli.ini",
    version: 1,
    checksum: "",
  },
];

export const COLOR_OPTIONS = [
  { id: "black", label: "Siyah" },
  { id: "white", label: "Beyaz" },
  { id: "gray", label: "Gri" },
  { id: "orange", label: "Turuncu" },
] as const;

export function withProfileChecksum<T extends { checksum: string }>(
  profile: T,
  contents: string,
): T {
  return {
    ...profile,
    checksum: createHash("sha256").update(contents).digest("hex"),
  };
}

export function qualityLabel(id: QualityProfile["id"]) {
  return QUALITY_PROFILES.find((item) => item.id === id)?.name ?? id;
}
