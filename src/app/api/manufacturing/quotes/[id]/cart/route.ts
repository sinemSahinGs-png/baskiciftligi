import { NextResponse } from "next/server";
import { z } from "zod";

import { configurationsMatch, verifyQuoteSignature } from "@/domain/manufacturing/quote-sign";
import type { PrintConfiguration } from "@/domain/manufacturing/types";
import { getManufacturingFile, getManufacturingQuote } from "@/domain/manufacturing/repository";
import { quotePurchasable } from "@/domain/manufacturing/quote-service";
import { getManufacturingActor, ownsRecord } from "@/lib/manufacturing/session";
import { quoteHmacSecret } from "@/lib/manufacturing/paths";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";

const cartBodySchema = z
  .object({
    unitPrice: z.number().optional(),
    unitPriceMinor: z.number().optional(),
    quantity: z.number().optional(),
    materialId: z.string().optional(),
    qualityId: z.string().optional(),
    configuration: z.record(z.string(), z.unknown()).optional(),
  })
  .optional();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({
    key: clientKey(request, "quote-cart"),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Sepet sınırı." }, { status: 429 });
  }

  const { id } = await context.params;
  let body: unknown = undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
    }
  }
  const parsedBody = cartBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Sepet isteği doğrulanamadı." }, { status: 422 });
  }
  if (
    parsedBody.data &&
    (parsedBody.data.unitPrice !== undefined || parsedBody.data.unitPriceMinor !== undefined)
  ) {
    return NextResponse.json(
      { error: "İstemci fiyatı kabul edilmez." },
      { status: 409 },
    );
  }

  const quote = await getManufacturingQuote(id);
  if (!quote) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }
  const actor = await getManufacturingActor();
  if (!ownsRecord(actor, quote)) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }
  const file = await getManufacturingFile(quote.fileId);
  if (!file || file.checksumSha256 !== quote.fileChecksum) {
    return NextResponse.json({ error: "Dosya özeti teklifle uyuşmuyor." }, { status: 409 });
  }
  let verifySecret = "";
  try {
    verifySecret = quoteHmacSecret();
  } catch {
    return NextResponse.json(
      { error: "Otomatik teklif imzası üretimde yapılandırılmadı." },
      { status: 503 },
    );
  }
  const signatureOk = verifyQuoteSignature(
    {
      quoteId: quote.id,
      jobId: quote.jobId,
      fileChecksum: quote.fileChecksum,
      grossMinor: quote.publicBreakdown.grossMinor,
      netMinor: quote.publicBreakdown.netMinor,
      vatMinor: quote.publicBreakdown.vatMinor,
      configuration: quote.configuration,
      pricingVersion: quote.pricingVersion,
      pricingChecksum: quote.pricingChecksum,
      slicerProfileChecksum: quote.slicerProfileChecksum,
      expiresAt: quote.expiresAt,
    },
    quote.signature,
    verifySecret,
  );
  if (!signatureOk) {
    return NextResponse.json({ error: "Teklif imzası geçersiz." }, { status: 409 });
  }
  if (Date.parse(quote.expiresAt) <= Date.now() || quote.status === "expired") {
    return NextResponse.json({ error: "Teklif süresi doldu." }, { status: 409 });
  }
  if (parsedBody.data?.quantity !== undefined && parsedBody.data.quantity !== quote.configuration.quantity) {
    return NextResponse.json(
      { error: "Adet teklif üretildikten sonra değiştirilemez. Yeni analiz gerekir." },
      { status: 409 },
    );
  }
  if (
    parsedBody.data?.materialId &&
    parsedBody.data.materialId !== quote.configuration.materialId
  ) {
    return NextResponse.json(
      { error: "Malzeme teklif ile uyuşmuyor. Yeni analiz gerekir." },
      { status: 409 },
    );
  }
  if (
    parsedBody.data?.qualityId &&
    parsedBody.data.qualityId !== quote.configuration.qualityId
  ) {
    return NextResponse.json(
      { error: "Kalite teklif ile uyuşmuyor. Yeni analiz gerekir." },
      { status: 409 },
    );
  }
  if (
    parsedBody.data?.configuration &&
    !configurationsMatch(
      quote.configuration,
      parsedBody.data.configuration as unknown as PrintConfiguration,
    )
  ) {
    return NextResponse.json({ error: "Yapılandırma uyuşmuyor." }, { status: 409 });
  }
  if (quote.provenance.source === "thingiverse" && !quotePurchasable(quote)) {
    return NextResponse.json(
      {
        error:
          "Bu model görüntülenebilir ancak ticari üretim veya otomatik satış kapalıdır.",
      },
      { status: 409 },
    );
  }
  if (quote.status !== "priced" && quote.status !== "needs_review") {
    return NextResponse.json({ error: "Teklif henüz fiyatlanmadı." }, { status: 409 });
  }

  return NextResponse.json({
    quoteId: quote.id,
    line: {
      productId: `mfq:${quote.id}`,
      quoteId: quote.id,
      quantity: quote.configuration.quantity,
    },
    purchasable: quotePurchasable(quote),
    reviewRequired: quote.reviewRequired,
  });
}
