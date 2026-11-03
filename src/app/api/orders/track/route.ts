import { NextResponse } from "next/server";
import { z } from "zod";

import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  email: z.email().max(160),
});

export async function POST(request: Request) {
  const limited = rateLimit({
    key: clientKey(request, "store-track"),
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Çok fazla deneme." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Sipariş no ve e-posta gerekli." }, { status: 422 });
  }

  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return NextResponse.json({ error: "Takip şu an kapalı." }, { status: 503 });
  }

  const { data: order } = await client
    .from("orders")
    .select("order_number, status, payment_status, fulfillment_status, total_minor, customer_snapshot")
    .eq("order_number", parsed.data.orderNumber.trim())
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  const snapshot = order.customer_snapshot as { email?: string; fullName?: string } | null;
  const email = (snapshot?.email ?? "").trim().toLocaleLowerCase("tr-TR");
  if (!email || email !== parsed.data.email.trim().toLocaleLowerCase("tr-TR")) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    status: {
      orderNumber: order.order_number,
      paymentState: order.payment_status,
      fulfilmentState: order.fulfillment_status ?? order.status,
      paymentLabel: String(order.payment_status),
      fulfilmentLabel: String(order.fulfillment_status ?? order.status),
      grandTotalMinor: Number(order.total_minor ?? 0),
      shipmentCarrier: null,
      shipmentTrackingNumber: null,
      shipmentTrackingUrl: null,
    },
    customerName: snapshot?.fullName ?? null,
  });
}
