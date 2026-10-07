import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { PackageSearch } from "lucide-react";

import {
  AccountEmptyState,
  AccountPageHeader,
} from "@/components/auth/account-ui";
import { requireViewer } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import { attachEligibleGuestOrders } from "@/lib/wholesale/tracking";
import { paymentStateLabel } from "@/lib/wholesale/labels";
import { WHOLESALE_PACKAGES } from "@/lib/wholesale/packages";

export const metadata: Metadata = {
  title: "Siparişlerim",
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const viewer = await requireViewer();
  if (viewer.isDemo) {
    return (
      <>
        <AccountPageHeader
          eyebrow="Hesabım / Siparişler"
          title="Siparişler"
          description="Misafir siparişleri, doğrulanmış e-posta girişi sonrası bu ekranda birleşir."
        />
        <AccountEmptyState
          icon={<PackageSearch className="size-6" aria-hidden="true" />}
          title="Bu ortamda müşteri hesabı yok"
          description="Sipariş listesi için Supabase oturumu gerekir."
          action={{ href: "/toptan", label: "Toptan siparişe dön" }}
        />
      </>
    );
  }

  const store = await getWholesaleStore();
  await attachEligibleGuestOrders({
    store,
    userId: viewer.id,
    verifiedEmail: viewer.email,
  });
  const orders = await store.listByUserId(viewer.id);

  return (
    <>
      <AccountPageHeader
        eyebrow="Hesabım / Siparişler"
        title="Siparişler"
        description="Yalnızca bu oturumdaki e-postaya sunucu tarafında bağlanmış siparişler listelenir."
      />
      {orders.length === 0 ? (
        <AccountEmptyState
          icon={<PackageSearch className="size-6" aria-hidden="true" />}
          title="Henüz sipariş yok"
          description="Toptan paketi satın aldığınızda siparişiniz burada görünür."
          action={{ href: "/toptan", label: "Toptan sipariş ver" }}
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/hesabim/siparisler/${order.orderNumber}` as Route}
                className="block min-h-11 rounded-xl border border-hairline bg-paper p-4"
              >
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-ink-muted">
                  {WHOLESALE_PACKAGES[order.packageSku].title} ·{" "}
                  {formatMoney(order.grandTotalMinor)}
                </p>
                <p className="text-xs">{paymentStateLabel(order.paymentState)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
