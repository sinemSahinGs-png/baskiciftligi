import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { listAdminOrders } from "@/domain/admin/order-board";
import { requireAdmin } from "@/lib/auth/session";
import { isLilDiscOnlyStaff } from "@/lib/catalog/authorization";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Siparişler",
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const viewer = await requireAdmin();
  const lilOnly = isLilDiscOnlyStaff(viewer.role);
  const rows = await listAdminOrders({ lilDiscOnly: lilOnly, limit: 120 });

  return (
    <>
      <AdminPageHeader
        eyebrow="Operasyon"
        title={lilOnly ? "LIL’ DISC siparişleri" : "Siparişler"}
        description="Mağaza siparişleri. Ödeme durumu PayTR geri bildirimine bağlıdır."
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz sipariş yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Sipariş</th>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Ürün</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Ödeme</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-semibold">{row.orderNumber}</td>
                  <td className="px-4 py-3">
                    {row.customerName}
                    <span className="block text-xs text-muted-foreground">
                      {row.customerEmail}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.itemNames.join(", ")}
                  </td>
                  <td className="px-4 py-3">{formatMoney(row.totalMinor)}</td>
                  <td className="px-4 py-3">{row.paymentStatus}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {lilOnly ? null : (
        <p className="mt-4 text-xs text-muted-foreground">
          Toptan siparişler ayrı listede:{" "}
          <Link href="/admin/toptan-siparisler" className="underline">
            Toptan siparişler
          </Link>
        </p>
      )}
    </>
  );
}
