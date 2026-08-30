import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getConsultationRequest,
  listConsultationRequests,
  updateConsultationRequest,
} from "@/domain/consultation/repository";
import { CONSULTATION_STATUSES } from "@/domain/consultation/types";
import { getViewer } from "@/lib/auth/session";
import { canViewAdminCatalog } from "@/lib/catalog/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer || !canViewAdminCatalog(viewer.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const rows = await listConsultationRequests();
  return NextResponse.json({ requests: rows });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(CONSULTATION_STATUSES).optional(),
  adminNote: z.string().max(2000).nullable().optional(),
  finalQuoteGrossMinor: z.number().int().min(0).nullable().optional(),
});

export async function PATCH(request: Request) {
  const viewer = await getViewer();
  if (!viewer || !canViewAdminCatalog(viewer.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz alanlar." }, { status: 422 });
  }
  const existing = await getConsultationRequest(parsed.data.id);
  if (!existing) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }
  const updated = await updateConsultationRequest(parsed.data.id, {
    status: parsed.data.status,
    adminNote: parsed.data.adminNote,
    finalQuoteGrossMinor: parsed.data.finalQuoteGrossMinor,
  });
  return NextResponse.json({ request: updated });
}
