export const stagePresets = [
  "cobalt",
  "violet",
  "coral",
  "cyan",
  "porcelain",
  "carbon",
  "orange",
  "split",
  "technical",
  "spectral",
] as const;

export type StagePreset = (typeof stagePresets)[number];

export interface StageRecipe {
  lighting: "radial" | "soft" | "split" | "none";
  shadow: boolean;
  pedestal: boolean;
  grid: boolean;
  contour: boolean;
  measure: boolean;
  signal: boolean;
}

export const stageRecipes: Record<StagePreset, StageRecipe> = {
  cobalt: {
    lighting: "radial",
    shadow: true,
    pedestal: true,
    grid: false,
    contour: false,
    measure: false,
    signal: true,
  },
  violet: {
    lighting: "radial",
    shadow: true,
    pedestal: false,
    grid: false,
    contour: true,
    measure: false,
    signal: false,
  },
  coral: {
    lighting: "radial",
    shadow: true,
    pedestal: true,
    grid: false,
    contour: false,
    measure: false,
    signal: false,
  },
  cyan: {
    lighting: "soft",
    shadow: true,
    pedestal: false,
    grid: true,
    contour: false,
    measure: true,
    signal: false,
  },
  porcelain: {
    lighting: "soft",
    shadow: true,
    pedestal: true,
    grid: false,
    contour: false,
    measure: false,
    signal: false,
  },
  carbon: {
    lighting: "none",
    shadow: true,
    pedestal: false,
    grid: true,
    contour: false,
    measure: true,
    signal: true,
  },
  orange: {
    lighting: "radial",
    shadow: true,
    pedestal: true,
    grid: false,
    contour: false,
    measure: false,
    signal: false,
  },
  split: {
    lighting: "split",
    shadow: true,
    pedestal: false,
    grid: false,
    contour: false,
    measure: false,
    signal: false,
  },
  technical: {
    lighting: "none",
    shadow: false,
    pedestal: false,
    grid: true,
    contour: true,
    measure: true,
    signal: true,
  },
  spectral: {
    lighting: "soft",
    shadow: true,
    pedestal: false,
    grid: false,
    contour: false,
    measure: false,
    signal: false,
  },
};

const categoryStages: Record<string, StagePreset> = {
  "biblo-ve-heykel": "violet",
  "masaustu-aksesuarlari": "cobalt",
  "kisiye-ozel-urunler": "coral",
  "fonksiyonel-parcalar": "technical",
  anahtarlik: "porcelain",
  magnet: "porcelain",
  "kurumsal-promosyon": "orange",
  "ev-ve-dekorasyon": "cyan",
  "yeni-gelenler": "spectral",
};

export function isStagePreset(value: unknown): value is StagePreset {
  return (
    typeof value === "string" &&
    (stagePresets as readonly string[]).includes(value)
  );
}

export function stageForCategory(slug?: string | null): StagePreset {
  if (!slug) {
    return "cobalt";
  }
  return categoryStages[slug] ?? "cobalt";
}

export function stageForProduct(product: {
  id: string;
  categorySlugs: string[];
  presentation?: { stagePreset?: StagePreset };
}): StagePreset {
  if (product.presentation?.stagePreset) {
    return product.presentation.stagePreset;
  }
  const fromCategory = product.categorySlugs
    .map((slug) => categoryStages[slug])
    .find(Boolean);
  if (fromCategory) {
    return fromCategory;
  }
  const index = Math.abs(hashString(product.id)) % stagePresets.length;
  return stagePresets[index];
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

export const stageClass: Record<StagePreset, string> = {
  cobalt: "stage-cobalt",
  violet: "stage-violet",
  coral: "stage-coral",
  cyan: "stage-cyan",
  porcelain: "stage-porcelain",
  carbon: "stage-carbon",
  orange: "stage-orange",
  split: "stage-split",
  technical: "stage-technical",
  spectral: "stage-spectral",
};
