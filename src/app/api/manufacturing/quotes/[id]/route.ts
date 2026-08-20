import { NextResponse } from "next/server";

import { getManufacturingQuote } from "@/domain/manufacturing/repository";
import { publicQuote } from "@/domain/manufacturing/public-dto";
import { getManufacturingActor, ownsRecord } from "@/lib/manufacturing/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const quote = await getManufacturingQuote(id);
  if (!quote) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }
  const actor = await getManufacturingActor();
  if (!ownsRecord(actor, quote)) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }
  return NextResponse.json(publicQuote(quote), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
