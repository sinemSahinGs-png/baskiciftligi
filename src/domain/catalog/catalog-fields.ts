import type {
  CatalogMaterialCode,
  InventoryPolicy,
  PersonalizationField,
  Product,
} from "@/domain/catalog/types";

const materialCodes: CatalogMaterialCode[] = [
  "PLA",
  "PETG",
  "TPU",
  "ASA",
  "ABS",
  "Resin",
  "Other",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberField(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

export function parsePersonalizationFields(value: unknown): PersonalizationField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = asRecord(item);
    const id = stringField(record, "id");
    const label = stringField(record, "label");
    const type = record.type;
    if (!id || !label) {
      return [];
    }
    if (
      type !== "text" &&
      type !== "initials" &&
      type !== "name" &&
      type !== "date" &&
      type !== "color" &&
      type !== "custom"
    ) {
      return [];
    }

    return [
      {
        id,
        type,
        label,
        placeholder: stringField(record, "placeholder"),
        required: record.required === true,
        minLength: numberField(record, "minLength"),
        maxLength: numberField(record, "maxLength"),
        helpText: stringField(record, "helpText"),
      },
    ];
  });
}

export function extraCatalogFieldsFromMetadata(
  metadata: Record<string, unknown>,
): Pick<
  Product,
  | "vatRateBps"
  | "inventoryPolicy"
  | "materialCode"
  | "materialSummary"
  | "weightGrams"
  | "widthMm"
  | "depthMm"
  | "heightMm"
  | "personalizationEnabled"
  | "personalizationFields"
  | "sortOrder"
  | "canonicalUrl"
  | "searchVisible"
  | "noindex"
  | "modelName"
  | "themeStyle"
> {
  const materialCode = stringField(metadata, "material_code");
  const inventoryPolicy = stringField(metadata, "inventory_policy");

  return {
    vatRateBps: numberField(metadata, "vat_rate_bps"),
    inventoryPolicy:
      inventoryPolicy === "continue" || inventoryPolicy === "deny"
        ? (inventoryPolicy as InventoryPolicy)
        : undefined,
    materialCode: materialCodes.includes(materialCode as CatalogMaterialCode)
      ? (materialCode as CatalogMaterialCode)
      : "",
    materialSummary: stringField(metadata, "material_summary") || undefined,
    weightGrams: numberField(metadata, "weight_grams") ?? null,
    widthMm: numberField(metadata, "width_mm") ?? null,
    depthMm: numberField(metadata, "depth_mm") ?? null,
    heightMm: numberField(metadata, "height_mm") ?? null,
    personalizationEnabled: metadata.personalization_enabled === true,
    personalizationFields: parsePersonalizationFields(
      metadata.personalization_fields ?? metadata.personalization_instructions,
    ),
    sortOrder: numberField(metadata, "sort_order") ?? 0,
    canonicalUrl: stringField(metadata, "canonical_url") || undefined,
    searchVisible: metadata.search_visible !== false,
    noindex: metadata.noindex === true,
    modelName: stringField(metadata, "model_name") || undefined,
    themeStyle: stringField(metadata, "theme_style") || undefined,
  };
}
