import { describe, expect, it } from "vitest";

import {
  extraCatalogFieldsFromMetadata,
  parsePersonalizationFields,
} from "@/domain/catalog/catalog-fields";

describe("catalog metadata fields", () => {
  it("parses personalization instructions without inventing materials", () => {
    const fields = parsePersonalizationFields([
      {
        id: "name-1",
        type: "name",
        label: "İsim",
        placeholder: "Adınız",
        required: true,
        helpText: "En fazla 24 karakter",
        maxLength: 24,
      },
      { id: "", type: "text", label: "Boş" },
    ]);

    expect(fields).toHaveLength(1);
    expect(fields[0]?.type).toBe("name");
    expect(fields[0]?.required).toBe(true);
  });

  it("maps extra catalog fields from metadata and never leaks cost", () => {
    const extra = extraCatalogFieldsFromMetadata({
      material_code: "PLA",
      personalization_enabled: true,
      personalization_fields: [
        {
          id: "text-1",
          type: "text",
          label: "Not",
          placeholder: "",
          required: false,
          helpText: "",
        },
      ],
      cost_price_minor: 1200,
      featured: true,
    });

    expect(extra.materialCode).toBe("PLA");
    expect(extra.personalizationEnabled).toBe(true);
    expect(extra.personalizationFields).toHaveLength(1);
    expect(extra).not.toHaveProperty("costPriceMinor");
  });
});
