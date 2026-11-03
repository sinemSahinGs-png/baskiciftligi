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
  const { createServiceRoleSupabaseClient } = await import("@/lib/supabase/admin");
  const client = createServiceRoleSupabaseClient();
  const { data: storeOrders } = client
    ? await client
        .from("orders")
        .select("id, order_number, payment_status, total_minor, placed_at")
        .eq("user_id", viewer.id)
        .order("placed_at", { ascending: false })
        .limit(40)
    : { data: [] };

  const hasAny = orders.length > 0 || (storeOrders ?? []).length > 0;

  return (
    <>
      <AccountPageHeader
        eyebrow="Hesabım / Siparişler"
        title="Siparişler"
        description="Üyelik hesabına bağlı mağaza ve toptan siparişlerin."
      />
      {!hasAny ? (
        <AccountEmptyState
          icon={<PackageSearch className="size-6" aria-hidden="true" />}
          title="Henüz sipariş yok"
          description="Mağazadan veya model yükleyerek sipariş verdiğinde burada görünür."
          action={{ href: "/magaza", label: "Mağazaya git" }}
        />
      ) : (
        <ul className="space-y-3">
          {(storeOrders ?? []).map((order) => (
            <li key={order.id} className="rounded-xl border border-hairline bg-paper p-4">
              <p className="font-semibold">{order.order_number}</p>
              <p className="text-sm text-ink-muted">
                Mağaza siparişi · {formatMoney(Number(order.total_minor ?? 0))}
              </p>
              <p className="text-xs">{order.payment_status}</p>
            </li>
          ))}
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
