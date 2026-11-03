import { NextResponse } from "next/server";

import { isPaytrTestMode } from "@/lib/wholesale/credentials";
import { WHOLESALE_PACKAGES, quoteWholesalePackage } from "@/lib/wholesale/packages";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import { getViewer } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getWholesaleStore();
  const settings = await store.getSettings();
  const viewer = await getViewer();
  const isAdmin = Boolean(
    viewer && (viewer.role === "admin" || viewer.role === "owner"),
  );
  const shippingConfigured = settings.shippingGrossMinor != null;
  const packages = Object.values(WHOLESALE_PACKAGES).map((pack) => {
    const quote = shippingConfigured
      ? quoteWholesalePackage(pack.sku, settings.shippingGrossMinor as number)
      : null;
    return {
      ...pack,
      quote,
    };
  });

  return NextResponse.json({
    packages,
    shippingConfigured,
    shippingGrossMinor: isAdmin ? settings.shippingGrossMinor : undefined,
    shippingAdminMessage: !shippingConfigured && isAdmin
      ? "Kargo ücreti yapılandırılmadı. Canlı ödeme kapalı. /admin/toptan-siparisler"
      : undefined,
    checkoutBlocked: !shippingConfigured,
    testMode: isPaytrTestMode(),
  });
}
