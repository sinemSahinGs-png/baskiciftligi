import Link from "next/link";
import type { Route } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { WholesaleSettingsPanel } from "@/components/wholesale/admin/settings-panel";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { getPaytrCredentials, isPaytrTestMode } from "@/lib/wholesale/credentials";
import {
  fulfilmentStateLabel,
  packageTitle,
  paymentStateLabel,
} from "@/lib/wholesale/labels";
import { buildWholesaleReadiness } from "@/lib/wholesale/readiness";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import type {
  WholesaleFulfilmentState,
  WholesalePaymentState,
} from "@/lib/wholesale/types";
import type { WholesalePackageSku } from "@/lib/wholesale/packages";

export const dynamic = "force-dynamic";

export default async function WholesaleOrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const payment = typeof query.payment === "string" ? query.payment : "";
  const fulfilment = typeof query.fulfilment === "string" ? query.fulfilment : "";
  const sku = typeof query.sku === "string" ? query.sku : "";
  const from = typeof query.from === "string" ? query.from : "";
  const to = typeof query.to === "string" ? query.to : "";

  const store = await getWholesaleStore();
  const [listed, settings] = await Promise.all([
    store.listOrders({
      query: q,
      paymentState: payment as WholesalePaymentState | "",
      fulfilmentState: fulfilment as WholesaleFulfilmentState | "",
      packageSku: sku as WholesalePackageSku | "",
      from,
      to,
    }),
    store.getSettings(),
  ]);
  const testMode = isPaytrTestMode();
  const readiness = buildWholesaleReadiness({
    settings,
    paytrCredentials: Boolean(getPaytrCredentials()),
    paytrTestMode: testMode,
    schemaAvailable: true,
  });
  const csv = `/api/admin/wholesale/orders?${new URLSearchParams({
    q,
    payment,
    fulfilment,
    sku,
    from,
    to,
    format: "csv",
  }).toString()}`;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Toptan"
        title="Toptan siparişler"
        description="Kaplamalı çakmak paket siparişleri. Ödeme durumu yalnızca güvenli ödeme onayı ile değişir."
      />

      <WholesaleSettingsPanel settings={settings} readiness={readiness} />

      <form className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <input
          name="q"
          defaultValue={q}
          className="min-h-11 rounded-md border border-white/15 bg-transparent px-3 text-sm"
          placeholder="No, ad, telefon, e-posta"
        />
        <select
          name="payment"
          defaultValue={payment}
          className="min-h-11 rounded-md border border-white/15 bg-transparent px-3 text-sm"
        >
          <option value="">Ödeme (tümü)</option>
          <option value="payment_pending">Ödeme bekleniyor</option>
          <option value="paid">Ödendi</option>
          <option value="payment_failed">Ödeme alınamadı</option>
          <option value="cancelled">İptal</option>
          <option value="refunded">İade</option>
        </select>
        <select
          name="fulfilment"
          defaultValue={fulfilment}
          className="min-h-11 rounded-md border border-white/15 bg-transparent px-3 text-sm"
        >
          <option value="">Hazırlık (tümü)</option>
          <option value="new">Sipariş alındı</option>
          <option value="preparing">Hazırlanıyor</option>
          <option value="ready_to_ship">Kargoya hazır</option>
          <option value="shipped">Kargoya verildi</option>
          <option value="delivered">Teslim edildi</option>
          <option value="cancelled">İptal</option>
        </select>
        <select
          name="sku"
          defaultValue={sku}
          className="min-h-11 rounded-md border border-white/15 bg-transparent px-3 text-sm"
        >
          <option value="">Paket</option>
          <option value="WS-LIGHTER-50">50’li paket</option>
          <option value="WS-LIGHTER-100">100’lü paket</option>
        </select>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="min-h-11 rounded-md border border-white/15 bg-transparent px-3 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="min-h-11 rounded-md border border-white/15 bg-transparent px-3 text-sm"
        />
        <button className="min-h-11 rounded-full bg-white text-sm font-semibold text-black sm:col-span-2 lg:col-span-6">
          Filtrele
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span>Yeni ödenmiş: {listed.newCount}</span>
        <span>Ödenen ciro: {formatMoney(listed.paidRevenueMinor)}</span>
        <a className="underline" href={csv}>
          CSV indir
        </a>
      </div>

      <ul className="space-y-2">
        {listed.rows.map((order) => (
          <li key={order.id}>
            <Link
              href={`/admin/toptan-siparisler/${order.id}` as Route}
              className="block min-h-11 rounded-xl border border-white/10 p-4"
            >
              <p className="font-semibold">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground">
                {order.customer.fullName} · {packageTitle(order.packageSku)} ·{" "}
                {formatMoney(order.grandTotalMinor)}
              </p>
              <p className="text-xs">
                {paymentStateLabel(order.paymentState)} /{" "}
                {fulfilmentStateLabel(order.fulfilmentState)}
                {order.paytrTestMode ? " · Test" : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
