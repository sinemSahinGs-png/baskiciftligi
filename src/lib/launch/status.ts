export const launchStatusLabels = [
  "Hazır",
  "Eksik",
  "Yapılandırılmadı",
  "Bağlantı kurulamadı",
  "Doğrulanmadı",
  "İşlem gerekiyor",
  "Üretimde kapalı",
] as const;

export type LaunchStatus = (typeof launchStatusLabels)[number];

export type LaunchTone = "ready" | "action" | "danger" | "neutral";

export function toneForLaunchStatus(status: LaunchStatus): LaunchTone {
  switch (status) {
    case "Hazır":
      return "ready";
    case "Eksik":
    case "Doğrulanmadı":
    case "İşlem gerekiyor":
      return "action";
    case "Bağlantı kurulamadı":
      return "danger";
    case "Yapılandırılmadı":
    case "Üretimde kapalı":
      return "neutral";
  }
}

export function statusFromConfiguredVerified(input: {
  configured: boolean;
  verified?: boolean | null;
  optional?: boolean;
}): LaunchStatus {
  if (!input.configured) {
    return input.optional ? "Yapılandırılmadı" : "Eksik";
  }
  if (input.verified === true) {
    return "Hazır";
  }
  if (input.verified === false) {
    return "Bağlantı kurulamadı";
  }
  return "Doğrulanmadı";
}

export interface LaunchCheckItem {
  id: string;
  label: string;
  status: LaunchStatus;
  detail: string;
}

export interface LaunchSection {
  id: string;
  title: string;
  items: LaunchCheckItem[];
}

export const LAUNCH_CHECKLIST_STEPS = [
  "domain",
  "supabase",
  "migrations",
  "owner",
  "catalog-import",
  "product-images",
  "thingiverse",
  "worker",
  "pricing",
  "paytr",
  "email",
  "smoke",
] as const;

export type LaunchChecklistStepId = (typeof LAUNCH_CHECKLIST_STEPS)[number];

export interface LaunchChecklistStep {
  id: LaunchChecklistStepId;
  title: string;
  status: LaunchStatus;
  missing: string;
  why: string;
  where: string;
  howVerified: string;
  customerImpact: string;
}
