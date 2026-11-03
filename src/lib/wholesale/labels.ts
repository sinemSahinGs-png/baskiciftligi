import { WHOLESALE_PACKAGES, type WholesalePackageSku } from "@/lib/wholesale/packages";
import type {
  WholesaleFulfilmentState,
  WholesalePaymentState,
} from "@/lib/wholesale/types";

export const CUSTOMER_CHECKOUT_CLOSED_MESSAGE =
  "Toptan siparişler kısa süre içinde açılacaktır.";

export function paymentStateLabel(state: WholesalePaymentState): string {
  switch (state) {
    case "payment_pending":
      return "Ödeme bekleniyor";
    case "paid":
      return "Ödendi";
    case "payment_failed":
      return "Ödeme alınamadı";
    case "cancelled":
      return "İptal";
    case "refunded":
      return "İade";
    default:
      return "Ödeme durumu güncelleniyor";
  }
}

export function fulfilmentStateLabel(state: WholesaleFulfilmentState): string {
  switch (state) {
    case "new":
      return "Sipariş alındı";
    case "preparing":
      return "Hazırlanıyor";
    case "ready_to_ship":
      return "Kargoya hazır";
    case "shipped":
      return "Kargoya verildi";
    case "delivered":
      return "Teslim edildi";
    case "cancelled":
      return "İptal";
    default:
      return "Hazırlık durumu güncelleniyor";
  }
}

export function packageTitle(sku: WholesalePackageSku): string {
  return WHOLESALE_PACKAGES[sku].title;
}
