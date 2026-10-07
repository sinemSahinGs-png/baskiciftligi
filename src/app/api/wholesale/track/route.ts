import { NextResponse } from "next/server";

import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { publicOrderStatus } from "@/lib/wholesale/checkout-service";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import { authorizeGuestTracking } from "@/lib/wholesale/tracking";
import { flattenZodErrors, wholesaleTrackSchema } from "@/lib/wholesale/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit({
    key: clientKey(request, "wholesale-track"),
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = wholesaleTrackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Sipariş numarası veya takip anahtarı geçersiz.", fields: flattenZodErrors(parsed.error) },
      { status: 422 },
    );
  }

  const store = await getWholesaleStore();
  const order = await authorizeGuestTracking({
    store,
    orderNumber: parsed.data.orderNumber.toUpperCase(),
    token: parsed.data.token,
  });

  if (!order) {
    return NextResponse.json(
      { error: "Sipariş bulunamadı. Numara ve takip bağlantısını kontrol edin." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: publicOrderStatus(order),
    customerName: order.customer.fullName,
  });
}
