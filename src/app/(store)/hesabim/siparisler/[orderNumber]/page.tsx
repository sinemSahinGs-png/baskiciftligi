import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import { AccountPageHeader } from "@/components/auth/account-ui";
import { requireViewer } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import { authorizeOwnedOrder } from "@/lib/wholesale/tracking";
import {
  fulfilmentStateLabel,
  paymentStateLabel,
} from "@/lib/wholesale/labels";
import { WHOLESALE_PACKAGES } from "@/lib/wholesale/packages";

export const metadata: Metadata = {
  title: "Sipariş detayı",
};

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const viewer = await requireViewer();
  const { orderNumber } = await params;
  if (viewer.isDemo) {
    notFound();
  }
  const store = await getWholesaleStore();
  const order = await authorizeOwnedOrder({
    store,
    orderNumber,
    userId: viewer.id,
  });
  if (!order) {
    notFound();
  }
  const pack = WHOLESALE_PACKAGES[order.packageSku];

  return (
    <>
      <AccountPageHeader
        eyebrow="Sipariş"
        title={order.orderNumber}
        description={pack.title}
      />
      <div className="space-y-3 text-sm">
        <p>Ödeme: {paymentStateLabel(order.paymentState)}</p>
        <p>Hazırlık: {fulfilmentStateLabel(order.fulfilmentState)}</p>
        <p>Toplam: {formatMoney(order.grandTotalMinor)}</p>
        {order.shipmentTrackingUrl ? (
          <a
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 font-semibold text-white"
            href={order.shipmentTrackingUrl}
            rel="noreferrer"
            target="_blank"
          >
            Kargoyu takip et
          </a>
        ) : null}
        <Link href={"/hesabim/siparisler" as Route} className="block underline">
          Tüm siparişler
        </Link>
      </div>
    </>
  );
}
