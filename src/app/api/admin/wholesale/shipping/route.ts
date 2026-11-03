import { NextResponse } from "next/server";
import { z } from "zod";

import { parseTryToMinor } from "@/lib/money";
import { requireWholesaleAdminApi } from "@/lib/wholesale/admin-auth";
import { getPaytrCredentials, isPaytrTestMode } from "@/lib/wholesale/credentials";
import { buildWholesaleReadiness } from "@/lib/wholesale/readiness";
import { getWholesaleStore } from "@/lib/wholesale/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  shippingTry: z.string().min(1).max(20),
  checkoutOpen: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireWholesaleAdminApi();
  if (!auth.ok || !auth.viewer) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Kargo tutarını 100,00 gibi Türk lirası olarak yazın." },
      { status: 422 },
    );
  }

  const minor = parseTryToMinor(parsed.data.shippingTry);
  if (minor == null || minor > 10_000_000) {
    return NextResponse.json(
      { error: "Kargo tutarını 100,00 gibi Türk lirası olarak yazın." },
      { status: 422 },
    );
  }

  const store = await getWholesaleStore();
  let settings = await store.setShipping({
    shippingGrossMinor: minor,
    actor: auth.viewer.id,
  });

  if (parsed.data.checkoutOpen !== undefined) {
    const paytrTestMode = isPaytrTestMode();
    const readiness = buildWholesaleReadiness({
      settings: { ...settings, checkoutOpen: parsed.data.checkoutOpen },
      paytrCredentials: Boolean(getPaytrCredentials()),
      paytrTestMode,
      schemaAvailable: true,
    });

    if (parsed.data.checkoutOpen && !readiness.customerCheckoutReady) {
      console.info("[wholesale-admin]", {
        actor: auth.viewer.id,
        reason: "CUSTOMER_CHECKLIST_INCOMPLETE",
      });
      return NextResponse.json(
        {
          error:
            "Satış açılamaz. Firma bilgileri, ödeme bilgileri ve sözleşme metinleri tamamlanmadan vitrin kapalı kalır.",
          settings,
        },
        { status: 409 },
      );
    }

    if (parsed.data.checkoutOpen && !paytrTestMode && !readiness.liveChecklistComplete) {
      console.info("[wholesale-admin]", {
        actor: auth.viewer.id,
        reason: "LIVE_CHECKLIST_INCOMPLETE",
      });
      return NextResponse.json(
        {
          error:
            "Canlı satış açılamaz. Kontrol listesindeki eksikleri tamamlayın; şimdilik yalnızca Test ödemesi kullanılabilir.",
          settings,
        },
        { status: 409 },
      );
    }

    try {
      settings = await store.setCheckoutOpen({
        checkoutOpen: parsed.data.checkoutOpen,
        actor: auth.viewer.id,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNKNOWN";
      console.info("[wholesale-admin]", {
        actor: auth.viewer.id,
        reason: code,
      });
      return NextResponse.json(
        {
          error:
            code === "SHIPPING_REQUIRED"
              ? "Önce kargo ücretini kaydedin."
              : "Ayar kaydedilemedi.",
        },
        { status: 422 },
      );
    }
  }

  return NextResponse.json({ settings });
}
