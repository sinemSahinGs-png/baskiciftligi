import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CircleDot,
  Package,
  Plus,
  Wallet,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import {
  cancelUnpaidCheckoutOrdersSince,
  listAdminOrders,
  summarizeOrders,
} from "@/domain/admin/order-board";
import { getOpsBoard } from "@/domain/admin/ops-board";
import { getAdminCatalogSummary } from "@/domain/catalog/admin-repository";
import { requireAdmin } from "@/lib/auth/session";
import { isLilDiscOnlyStaff } from "@/lib/catalog/authorization";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Satış paneli",
};

function channelLabel(channel: "lil_disc" | "store" | "mixed") {
  if (channel === "lil_disc") return "LIL’ DISC";
  if (channel === "mixed") return "Karışık";
  return "Mağaza";
}

export default async function AdminDashboardPage() {
  const viewer = await requireAdmin();
  const lilOnly = isLilDiscOnlyStaff(viewer.role);
  await cancelUnpaidCheckoutOrdersSince();
  const [today, recent, catalog, ops] = await Promise.all([
    listAdminOrders({ todayOnly: true, lilDiscOnly: lilOnly, limit: 80 }),
    listAdminOrders({ lilDiscOnly: lilOnly, limit: 12 }),
    lilOnly ? Promise.resolve(null) : getAdminCatalogSummary(),
    lilOnly ? Promise.resolve(null) : getOpsBoard(),
  ]);
  const todayStats = summarizeOrders(today);

  const metrics = [
    {
      label: "Bugünkü sipariş",
      value: String(todayStats.orderCount),
      detail: `${todayStats.paidCount} ödendi`,
      icon: Package,
    },
    {
      label: "Bugünkü ciro",
      value: formatMoney(todayStats.revenueMinor),
      detail: "Yalnızca ödenen siparişler",
      icon: Wallet,
    },
    {
      label: "Ödeme bekleyen",
      value: String(todayStats.pendingPayment),
      detail: "PayTR henüz onaylamadı",
      icon: Package,
    },
    {
      label: "LIL’ DISC",
      value: String(todayStats.lilDiscCount),
      detail: "Bugün albüm siparişi",
      icon: CircleDot,
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow={lilOnly ? "LIL’ DISC" : "Satış paneli"}
        title={lilOnly ? "Günlük LIL’ DISC siparişleri" : "Günlük satış özeti"}
        description="Trendyol satıcı ekranı gibi bugünün siparişleri, ciro ve kanal kırılımı. Ödeme durumu PayTR bildirimine bağlıdır."
        actions={
          lilOnly ? (
            <Link
              href="/admin/lil-disc"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f27a1a] px-5 text-sm font-bold text-white"
            >
              Albüm ekle
              <Plus className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link
                href="/admin/lil-disc"
                className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold"
              >
                LIL’ DISC
              </Link>
              <Link
                href="/admin/trendyol"
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f27a1a] px-5 text-sm font-bold text-white"
              >
                Trendyol çek
                <Plus className="size-4" aria-hidden="true" />
              </Link>
            </>
          )
        }
      />

      {ops ? (
        <Link
          href="/admin/gorevler"
          className="mb-6 flex items-center justify-between rounded-2xl border border-cyan/20 bg-cyan/5 px-5 py-4"
        >
          <span>
            <span className="block text-[0.65rem] font-bold tracking-[0.14em] text-cyan uppercase">
              Görevler
            </span>
            <span className="mt-1 block text-sm">
              {ops.openSite + ops.openGrowth} açık · {ops.xp} XP
            </span>
          </span>
          <ArrowRight className="size-4 text-cyan" />
        </Link>
      ) : null}

      <section aria-label="Bugün" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-white/10 bg-[#12151a] p-5"
          >
            <div className="flex items-start justify-between">
              <p className="text-[0.7rem] font-bold tracking-[0.12em] text-[#f27a1a] uppercase">
                {label}
              </p>
              <Icon className="size-4 text-[#f27a1a]" aria-hidden="true" />
            </div>
            <p className="tabular mt-5 font-heading text-3xl font-semibold tracking-[-0.04em]">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#12151a] px-5 py-4">
          <h2 className="font-heading text-lg font-semibold">Siparişler</h2>
          <Link
            href="/admin/siparisler"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#f27a1a]"
          >
            Tümü
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground">
            Henüz sipariş yok. Müşteri ödeme tamamlayınca burada görünür.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[0.7rem] tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3">Sipariş</th>
                <th className="px-5 py-3">Müşteri</th>
                <th className="px-5 py-3">Kanal</th>
                <th className="px-5 py-3">Tutar</th>
                <th className="px-5 py-3">Ödeme</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="px-5 py-3 font-semibold">
                    {row.orderNumber}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {row.itemNames.slice(0, 2).join(", ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {row.customerName}
                    <span className="block text-xs text-muted-foreground">
                      {row.customerEmail}
                    </span>
                  </td>
                  <td className="px-5 py-3">{channelLabel(row.channel)}</td>
                  <td className="px-5 py-3">{formatMoney(row.totalMinor)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        row.paymentStatus === "paid"
                          ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300"
                          : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-200"
                      }
                    >
                      {row.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {catalog ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Katalogda {catalog.activeProductCount} aktif ürün var.
        </p>
      ) : null}
    </>
  );
}
