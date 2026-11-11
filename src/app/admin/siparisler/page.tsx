import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Siparişler",
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const client = createServiceRoleSupabaseClient();
  const { data } = client
    ? await client
        .from("orders")
        .select("id, order_number, status, payment_status, total_minor, customer_snapshot, placed_at")
        .order("placed_at", { ascending: false })
        .limit(80)
    : { data: [] };

  const rows = data ?? [];

  return (
    <>
      <AdminPageHeader
        eyebrow="Operasyon"
        title="Siparişler"
        description="Mağaza ve model yükleme siparişleri. Ödeme durumu PayTR geri bildirimine bağlıdır."
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz mağaza siparişi yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Sipariş</th>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Ödeme</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const customer = row.customer_snapshot as { fullName?: string; email?: string };
                return (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-semibold">{row.order_number}</td>
                    <td className="px-4 py-3">
                      {customer?.fullName ?? "—"}
                      <span className="block text-xs text-muted-foreground">
                        {customer?.email ?? ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatMoney(Number(row.total_minor ?? 0))}</td>
                    <td className="px-4 py-3">{row.payment_status}</td>
                    <td className="px-4 py-3">{row.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Toptan siparişler ayrı listede:{" "}
        <Link href="/admin/toptan-siparisler" className="underline">
          Toptan siparişler
        </Link>
      </p>
    </>
  );
}
