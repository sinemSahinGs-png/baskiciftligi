import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileWarning } from "lucide-react";

import { OrderTimeline } from "@/components/commerce/order-timeline";
import {
  AccountEmptyState,
  AccountPageHeader,
} from "@/components/auth/account-ui";

export const metadata: Metadata = {
  title: "Sipariş ayrıntısı",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  if (!/^[A-Za-z0-9-]{3,40}$/.test(orderNumber)) {
    notFound();
  }

  return (
    <>
      <AccountPageHeader
        eyebrow="Hesabım / Sipariş ayrıntısı"
        title="Sipariş ayrıntısı"
        description="Bu rota Aşama 2 sipariş sorguları için güvenli hesap kabuğunda hazırlandı."
      />
      <AccountEmptyState
        icon={<FileWarning className="size-6" aria-hidden="true" />}
        title="Sipariş verisi henüz bağlı değil"
        description={`“${orderNumber}” referansı yalnızca URL’den alınan bir istektir; bir siparişin var olduğunu doğrulamaz. Sipariş deposu bu fazda okunmadığı için müşteri veya ödeme bilgisi gösterilmiyor.`}
        note="Aşama 2’de kayıt, oturum kullanıcısına ait değilse aynı şekilde bulunamadı yanıtı verilecek; başka müşterilere ait siparişler açığa çıkarılmayacak."
        action={{
          href: "/hesabim/siparisler",
          label: "Sipariş listesine dön",
        }}
      />
      <div className="mt-10">
        <OrderTimeline />
      </div>
    </>
  );
}
