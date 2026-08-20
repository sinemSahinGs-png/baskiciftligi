import { NextResponse } from "next/server";

import { adminQuoteCostBreakdown } from "@/domain/manufacturing/admin-dto";
import { getManufacturingQuote } from "@/domain/manufacturing/repository";
import { getViewer } from "@/lib/auth/session";
import { canViewInternalCost } from "@/lib/catalog/authorization";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer || !canViewInternalCost(viewer.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await context.params;
  const quote = await getManufacturingQuote(id);
  if (!quote) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(adminQuoteCostBreakdown(quote), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
