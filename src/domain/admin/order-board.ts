import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalMinor: number;
  placedAt: string | null;
  customerName: string;
  customerEmail: string;
  channel: "lil_disc" | "store" | "mixed";
  itemNames: string[];
};

function startOfTodayIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function isLilDiscSku(sku: string | null | undefined, options: unknown) {
  if (sku?.includes("cep-album") || sku?.startsWith("proj-cep-album")) {
    return true;
  }
  if (
    options &&
    typeof options === "object" &&
    "projectSource" in options &&
    (options as { projectSource?: string }).projectSource === "cep_album"
  ) {
    return true;
  }
  return false;
}

export async function listAdminOrders(input?: {
  lilDiscOnly?: boolean;
  todayOnly?: boolean;
  limit?: number;
}): Promise<AdminOrderRow[]> {
  const client = createServiceRoleSupabaseClient();
  if (!client) return [];

  let query = client
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total_minor, customer_snapshot, placed_at, order_items(product_name_snapshot, sku_snapshot, options_snapshot)",
    )
    .order("placed_at", { ascending: false })
    .limit(input?.limit ?? 80);

  if (input?.todayOnly) {
    query = query.gte("placed_at", startOfTodayIso());
  }

  const { data } = await query;
  const rows = (data ?? []).map((row) => {
    const customer = row.customer_snapshot as { fullName?: string; email?: string } | null;
    const items = (row.order_items ?? []) as Array<{
      product_name_snapshot?: string;
      sku_snapshot?: string;
      options_snapshot?: unknown;
    }>;
    const lilCount = items.filter((item) =>
      isLilDiscSku(item.sku_snapshot, item.options_snapshot),
    ).length;
    const channel: AdminOrderRow["channel"] =
      items.length > 0 && lilCount === items.length
        ? "lil_disc"
        : lilCount > 0
          ? "mixed"
          : "store";
    return {
      id: String(row.id),
      orderNumber: String(row.order_number),
      status: String(row.status),
      paymentStatus: String(row.payment_status),
      totalMinor: Number(row.total_minor ?? 0),
      placedAt: row.placed_at ? String(row.placed_at) : null,
      customerName: customer?.fullName ?? "—",
      customerEmail: customer?.email ?? "",
      channel,
      itemNames: items.map((item) => String(item.product_name_snapshot ?? "Ürün")),
    };
  });

  if (input?.lilDiscOnly) {
    return rows.filter((row) => row.channel !== "store");
  }
  return rows;
}

export function summarizeOrders(rows: AdminOrderRow[]) {
  const paid = rows.filter((row) => row.paymentStatus === "paid");
  return {
    orderCount: rows.length,
    paidCount: paid.length,
    revenueMinor: paid.reduce((sum, row) => sum + row.totalMinor, 0),
    pendingPayment: rows.filter((row) => row.paymentStatus === "pending").length,
    lilDiscCount: rows.filter((row) => row.channel !== "store").length,
  };
}
