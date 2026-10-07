import { NextResponse } from "next/server";

import { getViewer } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import {
  createWholesaleCheckoutOrder,
  publicOrderStatus,
  WholesaleCheckoutError,
} from "@/lib/wholesale/checkout-service";
import {
  getPaytrCredentials,
  isPaytrTestMode,
  isWholesalePaytrStubEnabled,
} from "@/lib/wholesale/credentials";
import { buildWholesaleReadiness } from "@/lib/wholesale/readiness";
import { requestPaytrIframeToken } from "@/lib/wholesale/paytr-client";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import { requestIdFrom, requestIp } from "@/lib/wholesale/request-ip";
import {
  flattenZodErrors,
  wholesaleCheckoutSchema,
} from "@/lib/wholesale/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYTR_MESSAGES: Record<string, string> = {
  PAYTR_UNCONFIGURED: "Güvenli ödeme şu anda yapılandırılmamış. Lütfen daha sonra deneyin.",
  PAYTR_NETWORK: "Ödeme bağlantısı kurulamadı. Bilgileriniz saklandı; tekrar deneyin.",
  PAYTR_BAD_RESPONSE: "Ödeme sağlayıcısından beklenmeyen yanıt alındı. Tekrar deneyin.",
  PAYTR_TOKEN_DENIED: "Ödeme oturumu başlatılamadı. Lütfen bilgileri kontrol edip tekrar deneyin.",
};

export async function POST(request: Request) {
  const limited = rateLimit({
    key: clientKey(request, "wholesale-checkout"),
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = wholesaleCheckoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Formu kontrol edin.",
        fields: flattenZodErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  const viewer = await getViewer();
  const actor =
    viewer && !viewer.isDemo
      ? { userId: viewer.id, email: viewer.email }
      : { userId: null, email: null };

  try {
    const store = await getWholesaleStore();
    const settings = await store.getSettings();
    const stub = isWholesalePaytrStubEnabled();
    const envTest = isPaytrTestMode() || stub;
    const readiness = buildWholesaleReadiness({
      settings,
      paytrCredentials: Boolean(getPaytrCredentials()) || stub,
      paytrTestMode: envTest,
      schemaAvailable: true,
    });
    const paytrTestMode = envTest || !readiness.liveChecklistComplete;
    if (!readiness.checkoutOpen) {
      console.info("[wholesale-checkout]", {
        requestId: requestIdFrom(request),
        reason: "CHECKOUT_CLOSED",
        shipping: readiness.shippingConfigured,
        company: readiness.companyComplete,
        paytr: readiness.paytrCredentials,
        legal: readiness.legalVersionsPresent,
      });
      return NextResponse.json(
        { error: "Toptan siparişler kısa süre içinde açılacaktır." },
        { status: 409 },
      );
    }
    const created = await createWholesaleCheckoutOrder({
      store,
      payload: parsed.data,
      actor,
      paytrTestMode,
    });

    if (
      !isWholesalePaytrStubEnabled() &&
      !getPaytrCredentials() &&
      process.env.NODE_ENV === "production"
    ) {
      return NextResponse.json(
        { error: PAYTR_MESSAGES.PAYTR_UNCONFIGURED },
        { status: 503 },
      );
    }

    const paytr = await requestPaytrIframeToken({
      order: created.order,
      userIp: requestIp(request),
    });

    return NextResponse.json({
      orderNumber: created.order.orderNumber,
      trackingToken: created.trackingToken || undefined,
      duplicate: created.duplicate,
      iframeSrc: paytr.iframeSrc,
      status: publicOrderStatus(created.order),
    });
  } catch (error) {
    if (error instanceof WholesaleCheckoutError) {
      if (error.code === "CHECKOUT_CLOSED" || error.code === "SHIPPING_UNCONFIGURED") {
        console.info("[wholesale-checkout]", {
          requestId: requestIdFrom(request),
          reason: error.code,
        });
        return NextResponse.json(
          { error: "Toptan siparişler kısa süre içinde açılacaktır." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && PAYTR_MESSAGES[error.message]) {
      console.info("[wholesale-checkout]", {
        requestId: requestIdFrom(request),
        reason: error.message,
      });
      return NextResponse.json(
        { error: PAYTR_MESSAGES[error.message] },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Sipariş başlatılamadı. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
