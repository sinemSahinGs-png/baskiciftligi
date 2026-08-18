import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileBox, FileText, Package, ShieldCheck } from "lucide-react";

import { AccountPageHeader } from "@/components/auth/account-ui";
import { siteConfig } from "@/config/site";
import { requireViewer } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Hesabım",
  description: `${siteConfig.name} hesap alanı.`,
};

const accountAreas = [
  {
    href: "/hesabim/siparisler",
    title: "Siparişler",
    description:
      "Ödeme altyapısı açıldığında geçmişiniz yalnızca bu oturuma bağlı görünecek.",
    icon: Package,
    status: "Hazırlık",
  },
  {
    href: "/hesabim/yuklemeler",
    title: "Model yüklemeleri",
    description:
      "Özel üretim dosyaları güvenli depolama akışı tamamlandığında açılacak.",
    icon: FileBox,
    status: "Hazırlık",
  },
  {
    href: "/hesabim/teklifler",
    title: "Teklifler",
    description:
      "Analiz ve fiyatlandırma iş akışı hazır olduğunda kayıtlarınızı izleyin.",
    icon: FileText,
    status: "Hazırlık",
  },
] as const;

export default async function AccountPage() {
  const viewer = await requireViewer();

  return (
    <>
      <AccountPageHeader
        eyebrow="Hesap"
        title={`Merhaba, ${viewer.displayName}`}
        description="Bu alan gerçek oturumunuzla korunur. Henüz devreye alınmayan ticari akışlar için örnek sipariş veya teklif gösterilmez."
      />

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-hairline bg-paper p-4">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-success"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold">Güvenli oturum etkin</p>
          <p className="mt-1 text-xs leading-5 text-ink-secondary">
            {viewer.email} hesabıyla görüntülüyorsunuz. Veriler yalnızca bu
            kullanıcı oturumuna göre sorgulanacaktır.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {accountAreas.map(({ href, title, description, icon: Icon, status }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-hairline bg-paper p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-md bg-muted">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="rounded-md bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-secondary">
                {status}
              </span>
            </div>
            <h2 className="mt-6 font-heading text-2xl font-bold">{title}</h2>
            <p className="mt-2 min-h-16 text-sm leading-6 text-ink-secondary">
              {description}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Alanı aç
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
