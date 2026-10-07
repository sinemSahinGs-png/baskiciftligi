import { z } from "zod";

import { WHOLESALE_PACKAGE_SKUS } from "@/lib/wholesale/packages";
import { isTurkishProvince } from "@/lib/wholesale/provinces";

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d+]/g, ""))
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  }, "Geçerli bir telefon numarası girin.");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Geçerli bir e-posta adresi girin.").max(254));

const nameSchema = z
  .string()
  .trim()
  .min(3, "Ad soyad en az 3 karakter olmalıdır.")
  .max(80, "Ad soyad çok uzun.")
  .refine((value) => /\p{L}/u.test(value), "Ad soyad harf içermelidir.");

const citySchema = z
  .string()
  .trim()
  .refine(isTurkishProvince, "Listeden bir il seçin.");

const districtSchema = z
  .string()
  .trim()
  .min(2, "İlçe girin.")
  .max(80, "İlçe adı çok uzun.");

const addressLineSchema = z
  .string()
  .trim()
  .min(10, "Açık adres en az 10 karakter olmalıdır.")
  .max(400, "Açık adres çok uzun.");

export const wholesaleAddressSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  city: citySchema,
  district: districtSchema,
  line: addressLineSchema,
});

const taxNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Vergi numarası 10 haneli olmalıdır.");

export const wholesaleCheckoutSchema = z
  .object({
    packageSku: z.enum(WHOLESALE_PACKAGE_SKUS, {
      error: "Geçerli bir paket seçin.",
    }),
    customer: wholesaleAddressSchema,
    sameAsShipping: z.boolean().default(true),
    invoiceType: z.enum(["bireysel", "kurumsal"]),
    companyName: z.string().trim().max(160).optional().nullable(),
    taxOffice: z.string().trim().max(80).optional().nullable(),
    taxNumber: z.string().trim().max(11).optional().nullable(),
    invoiceAddress: wholesaleAddressSchema.optional().nullable(),
    customerNote: z.string().trim().max(500).optional().nullable(),
    acceptPreliminary: z.literal(true, {
      error: "Ön bilgilendirme formunu onaylayın.",
    }),
    acceptDistanceSales: z.literal(true, {
      error: "Mesafeli satış sözleşmesini onaylayın.",
    }),
    acceptPrivacy: z.literal(true, {
      error: "Gizlilik ve KVKK bilgisini onaylayın.",
    }),
    idempotencyKey: z.string().trim().min(16).max(80),
    clientUnitPriceMinor: z.number().int().optional(),
    clientGrandTotalMinor: z.number().int().optional(),
    clientShippingMinor: z.number().int().optional(),
    clientPackageName: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.invoiceType === "kurumsal") {
      if (!value.companyName || value.companyName.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["companyName"],
          message: "Firma unvanı girin.",
        });
      }
      if (!value.taxOffice || value.taxOffice.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["taxOffice"],
          message: "Vergi dairesi girin.",
        });
      }
      const tax = taxNumberSchema.safeParse(value.taxNumber ?? "");
      if (!tax.success) {
        ctx.addIssue({
          code: "custom",
          path: ["taxNumber"],
          message: "Vergi numarası 10 haneli olmalıdır.",
        });
      }
    }
    if (!value.sameAsShipping && !value.invoiceAddress) {
      ctx.addIssue({
        code: "custom",
        path: ["invoiceAddress"],
        message: "Fatura adresi girin.",
      });
    }
  });

export type WholesaleCheckoutInput = z.infer<typeof wholesaleCheckoutSchema>;

export const wholesaleTrackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^BCW-[0-9A-HJKMNP-TV-Z]{10}$/i, "Sipariş numarası geçersiz."),
  token: z.string().trim().min(20).max(128),
});

export const wholesaleStatusQuerySchema = z.object({
  token: z.string().trim().min(20).max(128).optional(),
});

export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
