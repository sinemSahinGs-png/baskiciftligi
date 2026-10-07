import { NextResponse } from "next/server";

import { getViewer } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { publicOrderStatus } from "@/lib/wholesale/checkout-service";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import {
  authorizeGuestTracking,
  authorizeOwnedOrder,
} from "@/lib/wholesale/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  const limited = rateLimit({
    key: clientKey(request, "wholesale-status"),
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla sorgu. Lütfen bekleyin." },
      { status: 429 },
    );
  }

  const { orderNumber } = await context.params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const store = await getWholesaleStore();
  const viewer = await getViewer();

  let order = null;
  if (token) {
    order = await authorizeGuestTracking({ store, orderNumber, token });
  } else if (viewer && !viewer.isDemo) {
    order = await authorizeOwnedOrder({
      store,
      orderNumber,
      userId: viewer.id,
    });
  }

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ status: publicOrderStatus(order) });
}
