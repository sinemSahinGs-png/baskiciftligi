import { formatMoney } from "@/lib/money";
import type { WholesaleOrder } from "@/lib/wholesale/types";

function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function wholesaleOrdersToCsv(orders: WholesaleOrder[]): string {
  const header = [
    "order_number",
    "created_at",
    "package_sku",
    "payment_state",
    "fulfilment_state",
    "grand_total",
    "shipping",
    "customer_name",
    "phone",
    "email",
    "city",
    "district",
    "invoice_type",
    "paytr_test_mode",
    "tracking_number",
  ];
  const lines = orders.map((order) =>
    [
      order.orderNumber,
      order.createdAt,
      order.packageSku,
      order.paymentState,
      order.fulfilmentState,
      formatMoney(order.grandTotalMinor),
      formatMoney(order.shippingGrossMinor),
      order.customer.fullName,
      order.customer.phone,
      order.customer.email,
      order.customer.city,
      order.customer.district,
      order.invoice.type,
      order.paytrTestMode ? "test" : "live",
      order.shipmentTrackingNumber ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
