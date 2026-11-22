import { NextResponse } from "next/server";
import { z } from "zod";

import { createConsultationRequest } from "@/domain/consultation/repository";
import { resolveLicenseEvaluationFromCode } from "@/domain/consultation/license-evaluation";
import { estimateProductionPrice, PRINT_SIZE_PRESETS } from "@/domain/external-models/production-estimate";
import { PRICING_STATES } from "@/domain/external-models/pricing-state";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const customerFields = {
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(7).max(30),
  customerEmail: z.string().email().max(160).optional().nullable().or(z.literal("")),
  customerNote: z.string().max(800).optional().nullable(),
};

const thingiverseSchema = z.object({
  source: z.literal("thingiverse"),
  externalId: z.string().regex(/^\d+$/),
  modelTitle: z.string().min(1).max(200),
  creatorName: z.string().max(120).optional().nullable(),
  sourceUrl: z.string().url().max(500),
  licenseLabel: z.string().max(200).optional().nullable(),
  licenseCode: z.string().max(80).optional().nullable(),
  thumbnailUrl: z.string().url().max(500).optional().nullable(),
  material: z.string().min(1).max(40),
  color: z.string().min(1).max(40),
  sizePreset: z.enum(["kucuk", "orta", "buyuk"]),
  quantity: z.number().int().min(1).max(99),
  pricingState: z.enum(PRICING_STATES).optional(),
  ...customerFields,
});

const homepageSchema = z.object({
  source: z.literal("homepage"),
  ...customerFields,
  customerNote: z.string().min(8).max(800),
});

const lilDiscSchema = z.object({
  source: z.literal("lil_disc"),
  artist: z.string().min(2).max(120),
  albumName: z.string().min(1).max(200),
  customerEmail: z.string().email().max(160),
});

const bodySchema = z.discriminatedUnion("source", [
  thingiverseSchema,
  homepageSchema,
  lilDiscSchema,
]);

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/[<>\u0000-\u001F]/g, "").trim();
}

export async function POST(request: Request) {
  const limited = rateLimit({
    key: clientKey(request, "consultation"),
    limit: 8,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Eksik veya geçersiz alanlar." }, { status: 422 });
  }

  const input = parsed.data;

  try {
    const record = await (async () => {
      if (input.source === "homepage") {
        return createConsultationRequest({
          source: "homepage",
          externalId: "custom",
          modelTitle: "Özel sipariş ve destek",
          creatorName: null,
          sourceUrl: "https://octostudio.com.tr/ozel-siparis",
          licenseEvaluation: "manual_review",
          customerName: cleanText(input.customerName),
          customerPhone: cleanText(input.customerPhone),
          customerEmail: cleanText(input.customerEmail || null) || null,
          material: "belirsiz",
          color: "belirsiz",
          sizeLabel: PRINT_SIZE_PRESETS.orta.label,
          quantity: 1,
          customerNote: cleanText(input.customerNote),
          estimatedGrossMinor: null,
          pricingState: "unanalysed",
          productionOptions: { channel: "homepage" },
        });
      }

      if (input.source === "lil_disc") {
        const artist = cleanText(input.artist);
        const albumName = cleanText(input.albumName);
        return createConsultationRequest({
          source: "lil_disc",
          externalId: "lil-disc-album",
          modelTitle: albumName,
          creatorName: artist,
          sourceUrl: "https://octostudio.com.tr/kategori/lil-disc",
          licenseEvaluation: "manual_review",
          customerName: artist,
          customerPhone: "belirtilmedi",
          customerEmail: cleanText(input.customerEmail),
          material: "belirsiz",
          color: "belirsiz",
          sizeLabel: PRINT_SIZE_PRESETS.orta.label,
          quantity: 1,
          customerNote: `LIL’ DISC özel albüm isteği. Sanatçı: ${artist}. Albüm: ${albumName}.`,
          estimatedGrossMinor: null,
          pricingState: "unanalysed",
          productionOptions: { channel: "lil_disc" },
        });
      }

      const sizeLabel = PRINT_SIZE_PRESETS[input.sizePreset].label;
      const estimate = estimateProductionPrice({
        sizePreset: input.sizePreset,
        quantity: input.quantity,
        materialId: input.material,
        colorId: input.color,
      });
      const licenseEvaluation = resolveLicenseEvaluationFromCode(
        cleanText(input.licenseCode),
        cleanText(input.licenseLabel),
      ).code;
      return createConsultationRequest({
        source: input.source,
        externalId: input.externalId,
        modelTitle: cleanText(input.modelTitle),
        creatorName: cleanText(input.creatorName),
        sourceUrl: input.sourceUrl,
        licenseLabel: cleanText(input.licenseLabel),
        licenseCode: cleanText(input.licenseCode),
        licenseEvaluation,
        thumbnailUrl: input.thumbnailUrl ?? null,
        customerName: cleanText(input.customerName),
        customerPhone: cleanText(input.customerPhone),
        customerEmail: cleanText(input.customerEmail || null) || null,
        material: cleanText(input.material),
        color: cleanText(input.color),
        sizeLabel,
        quantity: input.quantity,
        customerNote: cleanText(input.customerNote),
        estimatedGrossMinor: estimate.grossMinor,
        pricingState: input.pricingState ?? "unanalysed",
        productionOptions: {
          sizePreset: input.sizePreset,
          material: input.material,
          color: input.color,
        },
      });
    })();
    return NextResponse.json({
      ok: true,
      id: record.id,
      message:
        input.source === "lil_disc"
          ? "Albüm isteğini aldık."
          : "Talebiniz alındı. İncelendikten sonra kesin fiyat ve üretim bilgisi paylaşılacaktır.",
    });
  } catch {
    return NextResponse.json(
      { error: "Talep kaydedilemedi. Lütfen daha sonra tekrar deneyin." },
      { status: 503 },
    );
  }
}
