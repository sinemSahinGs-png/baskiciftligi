import { formatMoney } from "@/lib/money";
import { packageTitle } from "@/lib/wholesale/labels";
import type { WholesaleOrder } from "@/lib/wholesale/types";

export function isTransactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function buildOrderConfirmationEmail(order: WholesaleOrder) {
  return {
    to: order.customer.email,
    subject: `${order.orderNumber} numaralı toptan siparişiniz alındı`,
    text: [
      `Sipariş numaranız: ${order.orderNumber}`,
      `Paket: ${packageTitle(order.packageSku)}`,
      `Toplam: ${formatMoney(order.grandTotalMinor)}`,
      order.paymentState === "paid"
        ? "Ödemeniz onaylandı."
        : "Ödeme onayı bekleniyor.",
      "Bu ileti, e-posta sağlayıcısı yapılandırıldığında gönderilir.",
    ].join("\n"),
  };
}

export function buildShipmentEmail(order: WholesaleOrder) {
  return {
    to: order.customer.email,
    subject: `${order.orderNumber} kargoya verildi`,
    text: [
      `Sipariş: ${order.orderNumber}`,
      order.shipmentCarrier ? `Kargo: ${order.shipmentCarrier}` : "",
      order.shipmentTrackingNumber
        ? `Takip no: ${order.shipmentTrackingNumber}`
        : "",
      order.shipmentTrackingUrl ? `Takip: ${order.shipmentTrackingUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function sendWholesaleEmail(
  kind: "confirmation" | "shipment",
  order: WholesaleOrder,
): Promise<WholesaleOrder["emailStatus"]> {
  if (!isTransactionalEmailConfigured()) {
    return "unconfigured";
  }
  void kind;
  void order;
  void buildOrderConfirmationEmail;
  void buildShipmentEmail;
  return "unconfigured";
}
