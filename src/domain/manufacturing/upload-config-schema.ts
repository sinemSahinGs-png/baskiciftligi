import { z } from "zod";

import { ALLOWED_INFILL, QUALITY_IDS } from "@/domain/manufacturing/types";

export const manufacturingUploadConfigSchema = z.object({
  materialId: z.literal("pla"),
  colorId: z.string().min(1).max(40),
  qualityId: z.enum(QUALITY_IDS),
  infillPercent: z.number().refine((value) => (ALLOWED_INFILL as readonly number[]).includes(value)),
  supports: z.enum(["auto", "on", "off"]),
  scalePercent: z.number().gt(0).lte(1000),
  quantity: z.int().min(1).max(20),
  unit: z.enum(["mm", "cm", "m", "custom"]),
  customScale: z.number().positive().nullable(),
});
