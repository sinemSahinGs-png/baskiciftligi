import type { Metadata } from "next";
import { Calculator } from "lucide-react";

import {
  AccountEmptyState,
  AccountPageHeader,
} from "@/components/auth/account-ui";

export const metadata: Metadata = {
  title: "Tekliflerim",
};

export default function QuotesPage() {
  return (
    <>
      <AccountPageHeader
        eyebrow="Hesabım / Teklifler"
        title="Baskı teklifleri"
        description="Model analizi ve sunucu tarafı fiyatlandırma tamamlandığında gerçek teklif kayıtlarınız burada yer alacak."
      />
      <AccountEmptyState
        icon={<Calculator className="size-6" aria-hidden="true" />}
        title="Henüz hesaplanmış teklif yok"
        description="Teklif motoru Aşama 3 kapsamındadır. Örnek tutar, tahmini üretim süresi veya sahte teklif durumu göstermiyoruz."
        note="Gerekli altyapı: model analizi, yazıcı profili, malzeme fiyatları, sunucu tarafı fiyat anlık görüntüsü ve süre sonu politikası."
        action={{ href: "/hesabim", label: "Hesap özetine dön" }}
      />
    </>
  );
}
