import { Mail, MapPin, Phone } from "lucide-react";

import {
  ContentCard,
  ContentPage,
  SectionHeading,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "İletişim",
  description: `${siteConfig.name} iletişim kanallarının güncel yapılandırma durumunu ve talep hazırlık rehberini görün.`,
  path: "/iletisim",
});

function getPublicContactConfiguration() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim();

  return {
    email: email || null,
    phone: phone || null,
  };
}

export default function ContactPage() {
  const contact = getPublicContactConfiguration();

  return (
    <ContentPage
      eyebrow="İletişim"
      title="Doğru soruyla başlayalım."
      description="Ürün, malzeme veya kurumsal üretim görüşmesine hazırlanırken kullanım amacı, adet aralığı ve hedef tarihi paylaşmanız değerlendirmeyi kolaylaştırır. Yalnız aşağıda aktif olarak işaretlenen kanalları kullanın."
    >
      {!contact.email && !contact.phone ? (
        <StatusNotice
          title="İletişim kanalları henüz yapılandırılmadı"
          tone="warning"
        >
          <p>
            `NEXT_PUBLIC_CONTACT_EMAIL` ve `NEXT_PUBLIC_CONTACT_PHONE`
            production ortamında doğrulanmış değerlerle ayarlanmayı bekliyor. Bu
            sayfada mesaj formu veya çalışan bir server action yoktur; hiçbir
            talep kaydedilmez ya da gönderilmiş sayılmaz.
          </p>
        </StatusNotice>
      ) : (
        <StatusNotice title="Yapılandırılmış doğrudan kanallar" tone="safe">
          <p>
            Aşağıda görünen kanallar public environment yapılandırmasından
            gelir. Göndermeden önce alıcı adresini veya numarayı cihazınızda
            kontrol edin. Site içi mesaj kaydı henüz aktif değildir.
          </p>
        </StatusNotice>
      )}

      <section className="pt-12" aria-labelledby="kanallar-baslik">
        <div id="kanallar-baslik">
          <SectionHeading
            eyebrow="Kanallar"
            title="Yapılandırma durumuna göre iletişim"
            description="Gösterilmeyen bir kanal henüz güvenilir iletişim yöntemi olarak sunulmaz."
          />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <ContentCard
            eyebrow={contact.email ? "Aktif" : "Bekliyor"}
            title="E-posta"
            description={
              contact.email
                ? "Genel sorular ve brief paylaşımı için yapılandırılmış adres."
                : "Doğrulanmış e-posta adresi production environment’a eklenmedi."
            }
          >
            <div className="flex items-center gap-3 text-sm">
              <Mail aria-hidden="true" className="size-4 text-cyan" />
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {contact.email}
                </a>
              ) : (
                <span className="text-muted-foreground">Kullanılamıyor</span>
              )}
            </div>
          </ContentCard>

          <ContentCard
            eyebrow={contact.phone ? "Aktif" : "Bekliyor"}
            title="Telefon"
            description={
              contact.phone
                ? "Public yapılandırmada bulunan doğrudan telefon kanalı."
                : "Doğrulanmış telefon numarası production environment’a eklenmedi."
            }
          >
            <div className="flex items-center gap-3 text-sm">
              <Phone aria-hidden="true" className="size-4 text-cyan" />
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {contact.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">Kullanılamıyor</span>
              )}
            </div>
          </ContentCard>

          <ContentCard
            eyebrow="Doğrulama gerekli"
            title="Atölye / ziyaret"
            description="Açık adres, ziyaret saatleri ve randevu politikası henüz yayınlanmış değildir."
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="size-4 text-cyan" />
              Fiziksel ziyaret planlamayın
            </div>
          </ContentCard>
        </div>
      </section>

      <section className="section-space" aria-labelledby="hazirlik-baslik">
        <div id="hazirlik-baslik">
          <SectionHeading
            eyebrow="Hazırlık"
            title="İlk mesajınıza ekleyebileceğiniz bilgiler"
            description="Kişisel veya gizli dosya göndermeden önce kanalın doğru alıcıya ait olduğunu teyit edin."
          />
        </div>
        <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          {[
            "Ürünün veya parçanın kullanım amacı",
            "Yaklaşık adet aralığı",
            "Kritik ölçü ve kullanım ortamı",
            "Hedef tarih ve teslimat şehri",
            "Renk, yüzey ve malzeme beklentisi",
            "Dosya hak sahipliği / üretim izni durumu",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <StatusNotice title="Site içi form neden yok?">
        <p>
          Supabase lead kaydı, spam koruması, açık iletişim rızası ve
          transactional e-posta altyapısı bağlanmadan bir formun başarılı
          gönderim mesajı göstermesi yanıltıcı olurdu. Bu nedenle sayfa yalnızca
          gerçekten yapılandırılmış doğrudan kanalları sunar.
        </p>
      </StatusNotice>
    </ContentPage>
  );
}
