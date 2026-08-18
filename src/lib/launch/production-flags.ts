import { parseStrictEnvBoolean } from "@/lib/env-boolean";

export const PRODUCTION_SAFETY_FLAG_NAMES = [
  "THINGIVERSE_FIXTURE_MODE",
  "ALLOW_PRODUCTION_DEMO_IMPORT",
  "ALLOW_DEMO_ADMIN_MUTATIONS",
] as const;

export type ProductionSafetyFlagName =
  (typeof PRODUCTION_SAFETY_FLAG_NAMES)[number];

export type FlagEnablement = "enabled" | "disabled";

export interface ProductionSafetyFlags {
  thingiverseFixtureMode: FlagEnablement;
  allowProductionDemoImport: FlagEnablement;
  allowDemoAdminMutations: FlagEnablement;
}

export function readProductionSafetyFlags(
  env: Record<string, string | undefined> = process.env,
): ProductionSafetyFlags {
  return {
    thingiverseFixtureMode: parseStrictEnvBoolean(env.THINGIVERSE_FIXTURE_MODE)
      ? "enabled"
      : "disabled",
    allowProductionDemoImport: parseStrictEnvBoolean(
      env.ALLOW_PRODUCTION_DEMO_IMPORT,
    )
      ? "enabled"
      : "disabled",
    allowDemoAdminMutations: parseStrictEnvBoolean(
      env.ALLOW_DEMO_ADMIN_MUTATIONS,
    )
      ? "enabled"
      : "disabled",
  };
}

export function dangerousProductionFlags(
  flags: ProductionSafetyFlags,
  nodeEnv?: string,
): ProductionSafetyFlagName[] {
  if ((nodeEnv ?? process.env.NODE_ENV) !== "production") {
    return [];
  }

  const dangerous: ProductionSafetyFlagName[] = [];
  if (flags.thingiverseFixtureMode === "enabled") {
    dangerous.push("THINGIVERSE_FIXTURE_MODE");
  }
  if (flags.allowProductionDemoImport === "enabled") {
    dangerous.push("ALLOW_PRODUCTION_DEMO_IMPORT");
  }
  if (flags.allowDemoAdminMutations === "enabled") {
    dangerous.push("ALLOW_DEMO_ADMIN_MUTATIONS");
  }
  return dangerous;
}

export function productionFixtureWarning(
  flags: ProductionSafetyFlags,
  nodeEnv?: string,
) {
  const names = dangerousProductionFlags(flags, nodeEnv ?? process.env.NODE_ENV);
  if (names.length === 0) {
    return null;
  }

  return {
    title: "Üretim güvenlik uyarısı",
    body: `Demo veya fixture bayrakları üretimde açık: ${names.join(", ")}. Müşteri vitrini çökmez; sahte katalog, fixture API ve demo mutasyonları kapatılmalıdır.`,
    flags: names,
  };
}
