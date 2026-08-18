import type { Metadata } from "next";
import { MapPinned } from "lucide-react";

import {
  AccountEmptyState,
  AccountPageHeader,
} from "@/components/auth/account-ui";

export const metadata: Metadata = {
  title: "Adreslerim",
};

export default function AddressesPage() {
  return (
    <>
      <AccountPageHeader
        eyebrow="Hesabım / Adresler"
        title="Adres defteri"
        description="Teslimat ve fatura adresleri ödeme akışıyla birlikte Aşama 2’de yönetilebilir olacak."
      />
      <AccountEmptyState
        icon={<MapPinned className="size-6" aria-hidden="true" />}
        title="Kayıtlı adres gösterilmiyor"
        description="Adres tablosu kullanıcı bazlı erişim politikalarına hazır olsa da bu fazda oluşturma ve düzenleme akışı açılmadı. Sizden henüz adres verisi istemiyoruz."
        note="Adres işlemleri açıldığında her kayıt yalnızca oturum sahibi tarafından okunabilecek ve değiştirilebilecek."
        action={{ href: "/hesabim", label: "Hesap özetine dön" }}
      />
    </>
  );
}
