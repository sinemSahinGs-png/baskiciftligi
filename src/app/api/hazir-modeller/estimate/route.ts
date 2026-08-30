import { NextResponse } from "next/server";
import { z } from "zod";

import {
  estimateProductionPrice,
  PRINT_SIZE_PRESETS,
} from "@/domain/external-models/production-estimate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  size: z.enum(["kucuk", "orta", "buyuk"]).default("orta"),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    size: searchParams.get("size") ?? "orta",
    quantity: searchParams.get("quantity") ?? "1",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz parametreler." }, { status: 422 });
  }
  const estimate = estimateProductionPrice({
    sizePreset: parsed.data.size,
    quantity: parsed.data.quantity,
  });
  return NextResponse.json({
    grossMinor: estimate.grossMinor,
    netMinor: estimate.netMinor,
    quantity: estimate.quantity,
    sizeLabel: estimate.sizeLabel,
    disclaimerTr: estimate.disclaimerTr,
    presets: PRINT_SIZE_PRESETS,
  });
}
