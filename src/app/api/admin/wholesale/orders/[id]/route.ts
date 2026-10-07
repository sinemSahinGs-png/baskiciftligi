import { NextResponse } from "next/server";
import { z } from "zod";

import { requireWholesaleAdminApi } from "@/lib/wholesale/admin-auth";
import {
  updateWholesaleFulfilment,
  WholesaleAdminError,
} from "@/lib/wholesale/fulfilment";
import { WHOLESALE_FULFILMENT_STATES } from "@/lib/wholesale/types";
import { getWholesaleStore } from "@/lib/wholesale/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  fulfilmentState: z.enum(WHOLESALE_FULFILMENT_STATES).optional(),
  shipmentCarrier: z.string().trim().max(80).nullable().optional(),
  shipmentTrackingNumber: z.string().trim().max(80).nullable().optional(),
  shipmentTrackingUrl: z.string().trim().max(300).nullable().optional(),
  internalNote: z.string().trim().max(500).nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireWholesaleAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const { id } = await context.params;
  const store = await getWholesaleStore();
  const order = await store.getById(id);
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  const events = await store.listEvents(id);
  return NextResponse.json({ order, events });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireWholesaleAdminApi();
  if (!auth.ok || !auth.viewer) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const { id } = await context.params;
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

  try {
    const store = await getWholesaleStore();
    const order = await updateWholesaleFulfilment({
      store,
      orderId: id,
      actor: `admin:${auth.viewer.id}`,
      ...parsed.data,
    });
    const events = await store.listEvents(id);
    return NextResponse.json({ order, events });
  } catch (error) {
    if (error instanceof WholesaleAdminError) {
      const status = error.code === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: "Güncellenemedi." }, { status: 500 });
  }
}
