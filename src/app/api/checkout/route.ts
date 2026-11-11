import { NextResponse } from "next/server";
import { z } from "zod";

import { getViewer } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import {
  createStoreCheckout,
  StoreCheckoutError,
} from "@/lib/store-checkout/service";
import { requestIp } from "@/lib/wholesale/request-ip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(120),
        variantId: z.string().min(1).max(120).nullable().optional(),
        quantity: z.number().int().min(1).max(99),
        quoteId: z.string().uuid().optional(),
      }),
    )
    .min(1)
    .max(50),
  fullName: z.string().trim().min(2).max(80),
  email: z.email().max(160),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  line: z.string().trim().min(6).max(200),
  note: z.string().max(400).optional(),
  acceptPreliminary: z.literal(true),
  acceptDistance: z.literal(true),
  acceptPrivacy: z.literal(true),
});

export async function POST(request: Request) {
  const limited = rateLimit({
    key: clientKey(request, "store-checkout"),
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Çok fazla deneme." }, { status: 429 });
  }

  const viewer = await getViewer();
  if (viewer?.isDemo) {
    return NextResponse.json({ error: "Demo oturumu sipariş veremez." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formu kontrol edin." }, { status: 422 });
  }

  try {
    const result = await createStoreCheckout({
      payload: parsed.data,
      userId: viewer?.id ?? null,
      userIp: requestIp(request),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StoreCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Ödeme başlatılamadı." }, { status: 503 });
  }
}
