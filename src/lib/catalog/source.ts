export type CatalogSource = "supabase" | "development-demo" | "unconfigured";

export function resolveCatalogSource(input: {
  supabaseConfigured: boolean;
  nodeEnv: string | undefined;
}): CatalogSource {
  if (input.supabaseConfigured) {
    return "supabase";
  }

  if (input.nodeEnv === "development") {
    return "development-demo";
  }

  return "unconfigured";
}

export function allowDemoCatalogImport(input: {
  nodeEnv: string | undefined;
  allowProductionImport: boolean;
}): boolean {
  return input.nodeEnv === "development" || input.allowProductionImport;
}
