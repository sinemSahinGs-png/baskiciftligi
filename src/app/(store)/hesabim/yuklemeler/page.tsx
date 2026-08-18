import type { Metadata } from "next";
import { FileUp } from "lucide-react";

import {
  AccountEmptyState,
  AccountPageHeader,
} from "@/components/auth/account-ui";

export const metadata: Metadata = {
  title: "Model yüklemelerim",
};

export default function UploadsPage() {
  return (
    <>
      <AccountPageHeader
        eyebrow="Hesabım / Yüklemeler"
        title="3D model yüklemeleri"
        description="Özel baskı dosyaları için kullanıcıya özel, özel erişimli depolama akışı Aşama 3’te açılacak."
      />
      <AccountEmptyState
        icon={<FileUp className="size-6" aria-hidden="true" />}
        title="Dosya yükleme henüz etkin değil"
        description="Bu sayfa şu anda dosya kabul etmez. Depolama kovası, zararlı dosya kontrolleri, model analizi ve işçi kimlik bilgileri tamamlanmadan yükleme yaptığımızı iddia etmiyoruz."
        note="Gerekli altyapı: private model-uploads bucket, kullanıcı yolu RLS politikası, dosya türü/boyut doğrulaması ve analiz işçisi."
        action={{ href: "/hesabim", label: "Hesap özetine dön" }}
      />
    </>
  );
}
