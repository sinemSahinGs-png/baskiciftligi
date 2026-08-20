import { NextResponse } from "next/server";
import { z } from "zod";

import { getCatalogSnapshot } from "@/domain/catalog/repository";
import { priceCart, type PricedCartLine } from "@/domain/commerce/cart-pricing";
import { computeCartShippingMinor } from "@/domain/commerce/shipping-policy";
import { pricedManufacturingLine } from "@/domain/commerce/manufacturing-cart";
import { getManufacturingQuote, getQuoteRevocation } from "@/domain/manufacturing/repository";
import { getManufacturingActor, ownsRecord } from "@/lib/manufacturing/session";
import { assertMinorUnits } from "@/lib/money";

const cartRequestSchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(120),
        variantId: z.string().min(1).max(120).nullable().optional(),
        quantity: z.int().min(1).max(99),
        quoteId: z.string().uuid().optional(),
        unitPrice: z.number().optional(),
        unitPriceMinor: z.number().optional(),
      }),
    )
    .max(50),
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi." },
      { status: 400 },
    );
  }

  const parsed = cartRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Sepet içeriği doğrulanamadı.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const bodyRecord =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  if (
    bodyRecord &&
    ("estimatedShippingMinor" in bodyRecord ||
      "shippingMinor" in bodyRecord ||
      "totalMinor" in bodyRecord ||
      "subtotalMinor" in bodyRecord)
  ) {
    return NextResponse.json(
      { error: "İstemci kargo veya toplam tutarı kabul edilmez." },
      { status: 409 },
    );
  }

  const actor = await getManufacturingActor();
  if (
    parsed.data.lines.some(
      (line) => line.unitPrice !== undefined || line.unitPriceMinor !== undefined,
    )
  ) {
    return NextResponse.json(
      { error: "İstemci fiyatı kabul edilmez." },
      { status: 409 },
    );
  }
  const catalogLines = parsed.data.lines.filter(
    (line) => !line.quoteId && !line.productId.startsWith("mfq:"),
  );
  const quoteLines = parsed.data.lines.filter(
    (line) => line.quoteId || line.productId.startsWith("mfq:"),
  );

  const snapshot = await getCatalogSnapshot();
  const catalogResult = priceCart(catalogLines, snapshot.products);

  const manufacturingPriced: PricedCartLine[] = [];
  for (const line of quoteLines) {
    const quoteId = line.quoteId ?? line.productId.slice(4);
    const quote = await getManufacturingQuote(quoteId);
    if (!quote || !ownsRecord(actor, quote)) {
      manufacturingPriced.push({
        key: `mfq:${quoteId}`,
        productId: `mfq:${quoteId}`,
        variantId: null,
        name: "Geçersiz üretim teklifi",
        variantName: null,
        slug: "",
        imageUrl: null,
        unitPriceMinor: 0,
        lineTotalMinor: 0,
        quantity: line.quantity,
        availableQuantity: 0,
        isAvailable: false,
        productionLeadTimeDays: { min: 0, max: 0 },
        isDemo: false,
        kind: null,
        displayKind: "uploaded",
        quoteId,
      });
      continue;
    }
    manufacturingPriced.push(
      pricedManufacturingLine(quote, {
        revoked: Boolean(await getQuoteRevocation(quoteId)),
      }),
    );
  }

  const lines = [...catalogResult.lines, ...manufacturingPriced];
  const subtotalMinor = assertMinorUnits(
    lines.reduce(
      (total, line) => total + (line.isAvailable ? line.lineTotalMinor : 0),
      0,
    ),
  );
  const estimatedShippingMinor = computeCartShippingMinor(subtotalMinor);

  return NextResponse.json(
    {
      ...catalogResult,
      lines,
      subtotalMinor,
      estimatedShippingMinor,
      totalMinor: assertMinorUnits(subtotalMinor + estimatedShippingMinor),
      hasUnavailableItems: lines.some((line) => !line.isAvailable),
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
