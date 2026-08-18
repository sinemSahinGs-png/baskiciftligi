import { z } from "zod";

const recordIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/, "Geçersiz kayıt kimliği.");

const optionalRecordIdSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  recordIdSchema.optional(),
);

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug en az 2 karakter olmalıdır.")
  .max(180)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Yalnızca küçük harf, rakam ve tek tire kullanın.",
  );

const minorUnitSchema = z
  .number({ error: "Geçerli bir tutar girin." })
  .int("Tutar kuruş cinsinden tam sayı olmalıdır.")
  .min(0, "Tutar negatif olamaz.")
  .max(100_000_000_000, "Tutar desteklenen sınırı aşıyor.");

const optionalUrlSchema = z.union([
  z.literal(""),
  z.url("Geçerli bir URL girin."),
  z
    .string()
    .regex(/^\/(?!\/)[^\s]*$/, "Kökten başlayan geçerli bir yol girin."),
]);

export const productMediaSchema = z.object({
  id: optionalRecordIdSchema,
  url: optionalUrlSchema.refine((value) => value.length > 0, {
    message: "Görsel URL’si zorunludur.",
  }),
  alt: z.string().trim().min(2, "Alternatif metin zorunludur.").max(180),
  position: z.coerce.number().int().min(0).max(500),
  role: z
    .enum([
      "primary",
      "cover",
      "hover",
      "mobile",
      "gallery",
      "video",
      "dimensions",
      "detail",
      "lifestyle",
      "social",
    ])
    .optional(),
  objectPosition: z.string().trim().max(40).optional(),
  mobileObjectPosition: z.string().trim().max(40).optional(),
  isolated: z.boolean().optional(),
  variantId: z.union([recordIdSchema, z.literal(""), z.null()]).optional(),
  storagePath: z.string().trim().max(500).optional(),
  mimeType: z.string().trim().max(80).optional(),
});

export const productVariantSchema = z.object({
  id: optionalRecordIdSchema,
  name: z.string().trim().min(1, "Varyant adı zorunludur.").max(180),
  sku: z.string().trim().min(1, "Varyant SKU zorunludur.").max(80),
  barcode: z.string().trim().max(80).optional(),
  colorName: z.string().trim().max(80),
  colorHex: z.union([
    z.literal(""),
    z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Renk kodu #RRGGBB biçiminde olmalıdır."),
  ]),
  material: z.string().trim().max(80).optional(),
  sizeLabel: z.string().trim().max(80).optional(),
  priceAdjustmentMinor: z.coerce
    .number({ error: "Geçerli bir fiyat farkı girin." })
    .int("Fiyat farkı kuruş cinsinden tam sayı olmalıdır.")
    .min(-100_000_000_000)
    .max(100_000_000_000),
  inventoryQuantity: z.coerce
    .number({ error: "Geçerli bir stok girin." })
    .int("Stok tam sayı olmalıdır.")
    .min(0, "Stok negatif olamaz.")
    .max(10_000_000),
  isActive: z.boolean(),
});

export const productFormSchema = z
  .object({
    id: optionalRecordIdSchema,
    name: z.string().trim().min(2, "Ürün adı zorunludur.").max(180),
    slug: slugSchema,
    shortDescription: z.string().trim().min(10, "Kısa açıklama çok kısa.").max(320),
    description: z.string().trim().min(20, "Ürün açıklaması çok kısa.").max(20_000),
    status: z.enum(["draft", "scheduled", "active", "archived"]),
    kind: z.enum(["ready_stock", "made_to_order", "hybrid"]),
    priceMinor: minorUnitSchema,
    compareAtPriceMinor: minorUnitSchema.nullable(),
    sku: z.string().trim().min(1, "Ana SKU zorunludur.").max(80),
    barcode: z.string().trim().max(80),
    productionLeadTimeMinDays: z.coerce.number().int().min(0).max(365),
    productionLeadTimeMaxDays: z.coerce.number().int().min(0).max(365),
    categorySlugs: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(slugSchema).max(30),
    ),
    collectionSlugs: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(slugSchema).max(30),
    ),
    featured: z.coerce.boolean(),
    vatRateBps: z.number().int().min(0).max(10_000).optional(),
    costPriceMinor: minorUnitSchema.nullable().optional(),
    inventoryPolicy: z.enum(["deny", "continue"]).optional(),
    materialCode: z
      .enum(["", "PLA", "PETG", "TPU", "ASA", "ABS", "Resin", "Other"])
      .optional(),
    materialSummary: z.string().trim().max(2_000).optional(),
    weightGrams: z.number().min(0).max(1_000_000).nullable().optional(),
    widthMm: z.number().min(0).max(10_000).nullable().optional(),
    depthMm: z.number().min(0).max(10_000).nullable().optional(),
    heightMm: z.number().min(0).max(10_000).nullable().optional(),
    personalizationEnabled: z.boolean().optional(),
    personalizationFields: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(80),
          type: z.enum(["text", "initials", "name", "date", "color", "custom"]),
          label: z.string().trim().min(1).max(80),
          placeholder: z.string().trim().max(120),
          required: z.boolean(),
          minLength: z.number().int().min(0).max(500).optional(),
          maxLength: z.number().int().min(1).max(500).optional(),
          helpText: z.string().trim().max(320),
        }),
      )
      .max(20)
      .optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
    canonicalUrl: z.union([z.literal(""), z.url()]).optional(),
    searchVisible: z.boolean().optional(),
    noindex: z.boolean().optional(),
    modelName: z.string().trim().max(180).optional(),
    themeStyle: z.string().trim().max(120).optional(),
    stagePreset: z
      .enum([
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
        "",
      ])
      .optional(),
    objectPosition: z.string().trim().max(40).optional(),
    mobileObjectPosition: z.string().trim().max(40).optional(),
    isolated: z.boolean().optional(),
    badges: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(z.enum(["new", "bestseller", "limited"])).max(3),
    ),
    publishedAt: z.union([
      z.literal(""),
      z.iso.datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    ]).transform((value) => {
      if (!value) {
        return "";
      }
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return new Date(value).toISOString();
      }
      return value;
    }),
    seoTitle: z.string().trim().max(180),
    seoDescription: z.string().trim().max(320),
    media: z.array(productMediaSchema).max(30),
    variants: z
      .array(productVariantSchema)
      .min(1, "En az bir varyant gereklidir.")
      .max(100),
  })
  .superRefine((value, context) => {
    if (
      value.compareAtPriceMinor !== null &&
      value.compareAtPriceMinor > 0 &&
      value.compareAtPriceMinor < value.priceMinor
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPriceMinor"],
        message: "Karşılaştırma fiyatı satış fiyatından düşük olamaz.",
      });
    }

    if (
      value.productionLeadTimeMaxDays < value.productionLeadTimeMinDays
    ) {
      context.addIssue({
        code: "custom",
        path: ["productionLeadTimeMaxDays"],
        message: "Azami üretim süresi asgari süreden kısa olamaz.",
      });
    }

    if (value.status === "active" && !value.publishedAt) {
      context.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "Yayındaki ürün için yayın tarihi zorunludur.",
      });
    }

    if (value.status === "scheduled" && !value.publishedAt) {
      context.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "Planlanan ürün için yayın tarihi zorunludur.",
      });
    }

    const skus = value.variants.map((variant) =>
      variant.sku.toLocaleLowerCase("tr-TR"),
    );

    if (new Set(skus).size !== skus.length) {
      context.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Varyant SKU değerleri benzersiz olmalıdır.",
      });
    }

    value.variants.forEach((variant, index) => {
      if (value.priceMinor + variant.priceAdjustmentMinor < 0) {
        context.addIssue({
          code: "custom",
          path: ["variants", index, "priceAdjustmentMinor"],
          message: "Varyantın nihai fiyatı negatif olamaz.",
        });
      }
    });
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  id: recordIdSchema.optional(),
  name: z.string().trim().min(2, "Kategori adı zorunludur.").max(120),
  slug: slugSchema,
  description: z.string().trim().max(2_000),
  eyebrow: z.string().trim().max(80).optional(),
  imageUrl: optionalUrlSchema,
  imageFit: z.enum(["cover", "contain"]).default("cover"),
  imageScale: z.number().int().min(50).max(200).default(100),
  objectPosition: z.string().trim().max(40).optional(),
  status: z.enum(["draft", "published", "archived"]),
  position: z.number().int().min(0).max(100_000),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const catalogRecordIdSchema = recordIdSchema;
