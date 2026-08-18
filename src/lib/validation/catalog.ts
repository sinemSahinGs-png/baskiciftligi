import { z } from "zod";

const recordIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/, "Geçersiz kayıt kimliği.");

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
  id: recordIdSchema.optional(),
  url: optionalUrlSchema.refine((value) => value.length > 0, {
    message: "Görsel URL’si zorunludur.",
  }),
  alt: z.string().trim().min(2, "Alternatif metin zorunludur.").max(180),
  position: z.number().int().min(0).max(500),
  role: z
    .enum(["primary", "hover", "mobile", "gallery", "video"])
    .optional(),
  objectPosition: z.string().trim().max(40).optional(),
  mobileObjectPosition: z.string().trim().max(40).optional(),
  isolated: z.boolean().optional(),
});

export const productVariantSchema = z.object({
  id: recordIdSchema.optional(),
  name: z.string().trim().min(1, "Varyant adı zorunludur.").max(180),
  sku: z.string().trim().min(1, "Varyant SKU zorunludur.").max(80),
  colorName: z.string().trim().max(80),
  colorHex: z.union([
    z.literal(""),
    z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Renk kodu #RRGGBB biçiminde olmalıdır."),
  ]),
  priceAdjustmentMinor: z
    .number({ error: "Geçerli bir fiyat farkı girin." })
    .int("Fiyat farkı kuruş cinsinden tam sayı olmalıdır.")
    .min(-100_000_000_000)
    .max(100_000_000_000),
  inventoryQuantity: z
    .number({ error: "Geçerli bir stok girin." })
    .int("Stok tam sayı olmalıdır.")
    .min(0, "Stok negatif olamaz.")
    .max(10_000_000),
  isActive: z.boolean(),
});

export const productFormSchema = z
  .object({
    id: recordIdSchema.optional(),
    name: z.string().trim().min(2, "Ürün adı zorunludur.").max(180),
    slug: slugSchema,
    shortDescription: z.string().trim().min(10, "Kısa açıklama çok kısa.").max(320),
    description: z.string().trim().min(20, "Ürün açıklaması çok kısa.").max(20_000),
    status: z.enum(["draft", "active", "archived"]),
    kind: z.enum(["ready_stock", "made_to_order"]),
    priceMinor: minorUnitSchema,
    compareAtPriceMinor: minorUnitSchema.nullable(),
    sku: z.string().trim().min(1, "Ana SKU zorunludur.").max(80),
    barcode: z.string().trim().max(80),
    productionLeadTimeMinDays: z.number().int().min(0).max(365),
    productionLeadTimeMaxDays: z.number().int().min(0).max(365),
    categorySlugs: z.array(slugSchema).max(30),
    collectionSlugs: z.array(slugSchema).max(30),
    featured: z.boolean(),
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
    badges: z.array(z.enum(["new", "bestseller", "limited"])).max(3),
    publishedAt: z.union([z.literal(""), z.iso.datetime()]),
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
        message: "Aktif ürün için yayın tarihi zorunludur.",
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
  imageUrl: optionalUrlSchema,
  status: z.enum(["draft", "published", "archived"]),
  position: z.number().int().min(0).max(100_000),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const catalogRecordIdSchema = recordIdSchema;
