import { NextResponse } from "next/server";

import { applyStorePaytrCallback } from "@/lib/store-checkout/service";
import { handlePaytrCallback } from "@/lib/wholesale/callback-service";
import { getPaytrCredentials } from "@/lib/wholesale/credentials";
import { sendWholesaleEmail } from "@/lib/wholesale/email";
import {
  parsePaytrTotalAmount,
  verifyPaytrCallbackHash,
  type PaytrCallbackPayload,
} from "@/lib/wholesale/paytr";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import { requestIdFrom } from "@/lib/wholesale/request-ip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function okResponse() {
  return new NextResponse("OK", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function GET() {
  return okResponse();
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return okResponse();
  }

  const payload: PaytrCallbackPayload = {
    merchantOid: formValue(form, "merchant_oid"),
    status: formValue(form, "status"),
    totalAmount: formValue(form, "total_amount"),
    hash: formValue(form, "hash"),
    paymentType: formValue(form, "payment_type") || undefined,
    failedReasonCode: formValue(form, "failed_reason_code") || undefined,
    failedReasonMsg: formValue(form, "failed_reason_msg") || undefined,
    testMode: formValue(form, "test_mode") || undefined,
  };

  if (!payload.merchantOid || !payload.hash || !payload.status) {
    return okResponse();
  }

  const credentials = getPaytrCredentials();
  if (!credentials) {
    console.info("[paytr-callback]", { requestId, result: "unconfigured" });
    return new NextResponse("credentials", { status: 503 });
  }

  if (!verifyPaytrCallbackHash(payload, credentials)) {
    return okResponse();
  }

  try {
    const store = await getWholesaleStore();
    const result = await handlePaytrCallback({
      store,
      payload,
      credentials,
      requestId,
    });

    if (!result.ok && result.reason === "unknown_order") {
      return applyRetailCallback(payload);
    }

    if (!result.ok) {
      console.info("[paytr-callback]", {
        requestId,
        merchantOid: payload.merchantOid,
        result: result.reason,
      });
      return new NextResponse(result.reason, { status: 400 });
    }

    if (result.applied && result.order.paymentState === "paid") {
      const emailStatus = await sendWholesaleEmail("confirmation", result.order);
      if (emailStatus) {
        await store.saveOrder({ ...result.order, emailStatus });
      }
    }

    console.info("[paytr-callback]", {
      requestId,
      merchantOid: payload.merchantOid,
      applied: result.applied,
      paymentState: result.order.paymentState,
    });
    return okResponse();
  } catch (error) {
    console.info("[paytr-callback]", {
      requestId,
      result: "wholesale_store_skipped",
    });
    void error;
    return applyRetailCallback(payload);
  }
}

async function applyRetailCallback(payload: PaytrCallbackPayload) {
  let amountMinor = 0;
  try {
    amountMinor = parsePaytrTotalAmount(payload.totalAmount);
  } catch {
    return okResponse();
  }
  try {
    await applyStorePaytrCallback({
      merchantOid: payload.merchantOid,
      success: payload.status === "success",
      amountMinor,
    });
  } catch {
    return okResponse();
  }
  return okResponse();
}
