import { z } from "zod";

const optionalMediaUrl = z.union([
  z.literal(""),
  z.url("Geçerli bir URL girin."),
  z
    .string()
    .regex(/^\/(?!\/)[^\s]*$/, "Kökten başlayan geçerli bir yol girin."),
]);

export const siteContentFormSchema = z.object({
  tagline: z.string().trim().min(2).max(180),
  description: z.string().trim().min(2).max(500),
  footerHeading: z.string().trim().min(2).max(180),
  footerDescription: z.string().trim().min(2).max(600),
  categoriesIntroTitle: z.string().trim().min(2).max(120),
  categoriesIntroDescription: z.string().trim().max(300),
  hero: z.object({
    eyebrow: z.string().trim().max(80),
    headline: z.string().trim().min(2).max(180),
    description: z.string().trim().min(2).max(500),
    primaryCtaLabel: z.string().trim().min(2).max(40),
    secondaryCtaLabel: z.string().trim().min(2).max(40),
    videoUrl: optionalMediaUrl,
    posterUrl: optionalMediaUrl,
    webmUrl: optionalMediaUrl.optional(),
  }),
});

export type SiteContentFormInput = z.infer<typeof siteContentFormSchema>;
