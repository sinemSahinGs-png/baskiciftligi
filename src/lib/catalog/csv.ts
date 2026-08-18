export interface CatalogCsvRow {
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  priceMinor: number;
  vatRateBps: number;
  stock: number;
  material: string;
  color: string;
  status: string;
}

export function serializeCatalogCsv(rows: CatalogCsvRow[]): string {
  const header = [
    "name",
    "slug",
    "sku",
    "barcode",
    "category",
    "description",
    "price_minor",
    "vat_bps",
    "stock",
    "material",
    "color",
    "status",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.name,
        row.slug,
        row.sku,
        row.barcode,
        row.category,
        row.description,
        String(row.priceMinor),
        String(row.vatRateBps),
        String(row.stock),
        row.material,
        row.color,
        row.status,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}

export function parseCatalogCsv(text: string): {
  rows: CatalogCsvRow[];
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV en az bir başlık ve bir veri satırı içermelidir."] };
  }

  const header = splitCsvLine(lines[0]).map((item) => item.trim().toLowerCase());
  const required = ["name", "slug", "sku", "price_minor", "status"];
  const missing = required.filter((column) => !header.includes(column));
  if (missing.length) {
    return {
      rows: [],
      errors: [`Eksik sütunlar: ${missing.join(", ")}`],
    };
  }

  const rows: CatalogCsvRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, index) => {
    const values = splitCsvLine(line);
    const record = Object.fromEntries(
      header.map((column, columnIndex) => [column, values[columnIndex] ?? ""]),
    );
    const lineNumber = index + 2;
    const priceMinor = Number(record.price_minor);
    const vatRateBps = Number(record.vat_bps || "2000");
    const stock = Number(record.stock || "0");

    if (!record.name?.trim() || !record.slug?.trim() || !record.sku?.trim()) {
      errors.push(`Satır ${lineNumber}: ad, slug ve SKU zorunludur.`);
      return;
    }

    if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) {
      errors.push(`Satır ${lineNumber}: price_minor tam sayı kuruş olmalıdır.`);
      return;
    }

    if (!Number.isSafeInteger(vatRateBps) || vatRateBps < 0 || vatRateBps > 10_000) {
      errors.push(`Satır ${lineNumber}: vat_bps 0–10000 aralığında tam sayı olmalıdır.`);
      return;
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {
      errors.push(`Satır ${lineNumber}: stock negatif olmayan tam sayı olmalıdır.`);
      return;
    }

    rows.push({
      name: record.name.trim(),
      slug: record.slug.trim(),
      sku: record.sku.trim(),
      barcode: (record.barcode ?? "").trim(),
      category: (record.category ?? "").trim(),
      description: (record.description ?? "").trim(),
      priceMinor,
      vatRateBps,
      stock,
      material: (record.material ?? "").trim(),
      color: (record.color ?? "").trim(),
      status: (record.status ?? "draft").trim(),
    });
  });

  return { rows, errors };
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        current += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
      continue;
    }

    if (character === ",") {
      result.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  result.push(current);
  return result;
}
