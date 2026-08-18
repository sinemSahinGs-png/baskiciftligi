import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import {
  AccountEmptyState,
  AccountPageHeader,
} from "@/components/auth/account-ui";

export const metadata: Metadata = {
  title: "Siparişlerim",
};

export default function OrdersPage() {
  return (
    <>
      <AccountPageHeader
        eyebrow="Hesabım / Siparişler"
        title="Siparişler"
        description="Gerçek ödeme ve sipariş kayıtlarınız Aşama 2’de, yalnızca bu oturuma bağlı olarak listelenecek."
      />
      <AccountEmptyState
        icon={<PackageSearch className="size-6" aria-hidden="true" />}
        title="Henüz kullanılabilir sipariş kaydı yok"
        description="Sipariş işleme ve ödeme entegrasyonu bu fazın kapsamında değil. Bu nedenle demo sipariş, sahte takip numarası veya örnek ödeme durumu göstermiyoruz."
        note="Güvenlik notu: Gelecek sipariş sorguları kullanıcı kimliğine bağlı RLS politikalarıyla sınırlandırılacak."
        action={{ href: "/", label: "Mağazaya dön" }}
      />
    </>
  );
}
