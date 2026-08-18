import { ArrowUpRight, ClipboardList, Mail } from "lucide-react";

import {
  ContentCard,
  ContentPage,
  SectionHeading,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";

export const metadata = createPageMetadata({
  title: "Kurumsal Teklif Hazırlığı",
  description:
    "3D baskı kurumsal üretim talebiniz için adet, kullanım, malzeme ve kalite beklentilerini içeren bir brief hazırlayın.",
  path: "/kurumsal-teklif",
});

const briefGroups = [
  {
    title: "İş hedefi",
    items: [
      "Parçanın kim tarafından ve nerede kullanılacağı",
      "Prototip, etkinlik, promosyon, aparat veya son ürün amacı",
      "Başarıyı belirleyen ölçü, görünüş ya da işlev kriteri",
    ],
  },
  {
    title: "Üretim kapsamı",
    items: [
      "Düşük, beklenen ve yüksek adet senaryosu",
      "Hedef teslim tarihi ile teslimat şehri",
      "Renk, yüzey, kişiselleştirme ve paketleme ihtiyacı",
    ],
  },
  {
    title: "Teknik girdi",
    items: [
      "Dosya formatı, ölçü birimi ve kritik ölçüler",
      "Isı, UV, nem, darbe veya kimyasal temas gibi ortam koşulları",
      "Dosyanın üretim ve ticari kullanım izninin kaynağı",
    ],
  },
  {
    title: "Onay düzeni",
    items: [
      "Numuneyi onaylayacak kişi veya ekip",
      "Revizyon için karar tarihi ve sorumluluk",
      "Parti kabulü ile uygunsuzluk bildirim yöntemi",
    ],
  },
] as const;

export default function CorporateQuotePage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
  const mailtoHref = email
    ? `mailto:${email}?subject=${encodeURIComponent("Kurumsal üretim brief’i")}`
    : null;

  return (
    <ContentPage
      eyebrow="Kurumsal teklif"
      title="Tekliften önce iyi bir brief oluşturun."
      description="Bu sayfa bir talebi otomatik olarak göndermez. İhtiyacınızı yapılandırmanıza ve gerçekten aktif bir iletişim kanalı varsa aynı kapsamı paylaşmanıza yardımcı olur."
      actions={[
        {
          href: "/kurumsal-uretim",
          label: "Üretim yaklaşımını görün",
          variant: "outline",
        },
      ]}
    >
      <StatusNotice
        title="Supabase lead ve e-posta gönderim altyapısı bekleniyor"
        tone="warning"
      >
        <p>
          Bu route üzerinde çalışan server action, CRM kaydı veya otomatik
          e-posta yoktur. Sayfayı görüntülemek teklif talebi oluşturmaz;
          herhangi bir başarı bildirimi de gösterilmez. E-posta butonu yalnız
          public environment içinde doğrulanmış adres varsa görünür.
        </p>
      </StatusNotice>

      <section
        className="section-space"
        aria-labelledby="brief-gruplari-baslik"
      >
        <div id="brief-gruplari-baslik">
          <SectionHeading
            eyebrow="Brief alanları"
            title="Değerlendirme için dört bilgi grubu"
            description="Kesin olmayan yanıtları tahmin gibi sunmak yerine “karar bekliyor” şeklinde işaretleyin."
          />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {briefGroups.map((group) => (
            <ContentCard key={group.title} title={group.title}>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </ContentCard>
          ))}
        </div>
      </section>

      <section
        className="grid gap-8 rounded-3xl border border-white/10 bg-card/70 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center"
        aria-labelledby="brief-ilet-baslik"
      >
        <div>
          <div className="flex items-center gap-3 text-cyan">
            <ClipboardList aria-hidden="true" className="size-5" />
            <span className="text-xs font-bold tracking-[0.16em] uppercase">
              İletim durumu
            </span>
          </div>
          <h2
            id="brief-ilet-baslik"
            className="mt-4 font-heading text-3xl font-medium"
          >
            {mailtoHref
              ? "Brief’i kendi e-posta uygulamanızla paylaşın"
              : "Doğrulanmış iletişim adresi bekleniyor"}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            {mailtoHref
              ? `Buton yalnız e-posta uygulamanızı açar. Mesajın gönderildiği veya ${siteConfig.name} sistemine kaydedildiği site tarafından doğrulanmaz.`
              : "NEXT_PUBLIC_CONTACT_EMAIL production ortamında ayarlanana kadar bu sayfa üzerinden brief iletilemez. Hassas dosyaları doğrulanmamış bir adrese göndermeyin."}
          </p>
        </div>

        {mailtoHref ? (
          <a
            href={mailtoHref}
            className={buttonVariants({ variant: "commerce", size: "lg" })}
          >
            <Mail aria-hidden="true" className="size-4" />
            E-posta taslağı aç
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        ) : (
          <span className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-muted-foreground">
            Kanal yapılandırılmadı
          </span>
        )}
      </section>
    </ContentPage>
  );
}
