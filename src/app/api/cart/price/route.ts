import { NextResponse } from "next/server";
import { z } from "zod";

import { getCatalogSnapshot } from "@/domain/catalog/repository";
import { priceCart } from "@/domain/commerce/cart-pricing";

const cartRequestSchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(120),
        variantId: z.string().min(1).max(120).nullable().optional(),
        quantity: z.int().min(1).max(99),
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

  const snapshot = await getCatalogSnapshot();
  const result = priceCart(parsed.data.lines, snapshot.products);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
