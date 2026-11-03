import { NextResponse } from "next/server";

import { handlePaytrCallback } from "@/lib/wholesale/callback-service";
import {
  getPaytrCredentials,
  isWholesalePaytrStubEnabled,
} from "@/lib/wholesale/credentials";
import { buildPaytrCallbackHash } from "@/lib/wholesale/paytr";
import { getWholesaleStore } from "@/lib/wholesale/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isWholesalePaytrStubEnabled()) {
    return NextResponse.json({ error: "Kapalı." }, { status: 404 });
  }

  const credentials = getPaytrCredentials();
  if (!credentials) {
    return NextResponse.json({ error: "PayTR test kimliği yok." }, { status: 503 });
  }

  const json = (await request.json()) as {
    merchantOid?: string;
    outcome?: "success" | "failed";
  };
  const merchantOid = json.merchantOid?.trim();
  if (!merchantOid) {
    return NextResponse.json({ error: "Sipariş yok." }, { status: 400 });
  }

  const store = await getWholesaleStore();
  const order = await store.getByMerchantOid(merchantOid);
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const status = json.outcome === "failed" ? "failed" : "success";
  const payload = {
    merchantOid,
    status,
    totalAmount: String(order.grandTotalMinor),
    hash: "",
    paymentType: "card",
    failedReasonCode: status === "failed" ? "99" : undefined,
    failedReasonMsg: status === "failed" ? "test_fail" : undefined,
    testMode: "1",
  };
  payload.hash = buildPaytrCallbackHash(payload, credentials);

  const result = await handlePaytrCallback({
    store,
    payload,
    credentials,
    requestId: "stub",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    paymentState: result.order.paymentState,
    orderNumber: result.order.orderNumber,
  });
}
