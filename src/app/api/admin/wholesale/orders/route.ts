import { NextResponse } from "next/server";

import { requireWholesaleAdminApi } from "@/lib/wholesale/admin-auth";
import { wholesaleOrdersToCsv } from "@/lib/wholesale/csv";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import type {
  WholesaleFulfilmentState,
  WholesalePaymentState,
} from "@/lib/wholesale/types";
import type { WholesalePackageSku } from "@/lib/wholesale/packages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function filtersFrom(url: URL) {
  return {
    query: url.searchParams.get("q") ?? "",
    paymentState: (url.searchParams.get("payment") ?? "") as WholesalePaymentState | "",
    fulfilmentState: (url.searchParams.get("fulfilment") ?? "") as WholesaleFulfilmentState | "",
    packageSku: (url.searchParams.get("sku") ?? "") as WholesalePackageSku | "",
    from: url.searchParams.get("from") ?? "",
    to: url.searchParams.get("to") ?? "",
  };
}

export async function GET(request: Request) {
  const auth = await requireWholesaleAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const url = new URL(request.url);
  const store = await getWholesaleStore();
  const listed = await store.listOrders(filtersFrom(url));
  const settings = await store.getSettings();

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(wholesaleOrdersToCsv(listed.rows), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="toptan-siparisler.csv"',
      },
    });
  }

  return NextResponse.json({
    ...listed,
    settings,
    paytrTestMode: process.env.PAYTR_TEST_MODE !== "0",
  });
}
