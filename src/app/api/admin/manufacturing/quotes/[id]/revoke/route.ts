import { NextResponse } from "next/server";
import { z } from "zod";

import { adminQuoteRevocationRecord } from "@/domain/manufacturing/admin-dto";
import {
  getManufacturingQuote,
  revokeManufacturingQuote,
} from "@/domain/manufacturing/repository";
import { getViewer } from "@/lib/auth/session";
import { canRevokeManufacturingQuotes } from "@/lib/catalog/authorization";

const bodySchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer || !canRevokeManufacturingQuotes(viewer.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "İptal gerekçesi gerekli." },
      { status: 422 },
    );
  }

  const { id } = await context.params;
  const quote = await getManufacturingQuote(id);
  if (!quote) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }

  try {
    const record = await revokeManufacturingQuote({
      quoteId: id,
      reason: parsed.data.reason,
      revokedBy: viewer.id,
    });
    return NextResponse.json(adminQuoteRevocationRecord(record));
  } catch (error) {
    const message = error instanceof Error ? error.message : "İptal edilemedi.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
