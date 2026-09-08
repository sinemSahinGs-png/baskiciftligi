import type { Route } from "next";
import Link from "next/link";

import {
  ContentCard,
  ContentPage,
  SectionHeading,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";

export const metadata = createPageMetadata({
  title: "Toptan & Bayiler",
  description:
    "Hediyelik, konsept mağaza, etkinlik ve kurumsal alımlar için adet bazlı 3D baskı teklifi. Mevcut kurumsal brief altyapısı kullanılır.",
  path: "/toptan",
});

const audiences = [
  "Hediyelik ve konsept mağazalar",
  "Hediyelik / souvenir noktaları",
  "Etkinlik şirketleri ve ajanslar",
  "Kafe ve yerel perakende",
  "Kurumsal promosyon alıcıları",
] as const;

const offerPoints = [
  {
    title: "Adet bazlı teklif",
    body: "Fiyat, gerçek dilimleme ve tekrarlanabilir üretim varsayımıyla hazırlanır. Bu sayfa otomatik sipariş oluşturmaz.",
  },
  {
    title: "Tekrar sipariş",
    body: "Onaylanan bir parça aynı ölçü, malzeme ve renk ile yeniden üretilebilir.",
  },
  {
    title: "Numune",
    body: "Seriden önce bir numune ile form ve yüzey kontrol edilebilir.",
  },
  {
    title: "Renk seçimi",
    body: "Stüdyoda bulunan filament renkleri teklif aşamasında netleştirilir.",
  },
] as const;

export default function WholesalePage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
  const mailtoHref = email
    ? `mailto:${email}?subject=${encodeURIComponent("Toptan / bayi üretim brief’i")}`
    : null;

  return (
    <ContentPage
      eyebrow="Toptan & Bayiler"
      title="Rafında hızlı satılacak ürünler."
      description="Hediyelik, konsept mağaza, etkinlik ve kurumsal alımlar için aynı üretim standardı. Teklif, mevcut kurumsal brief hattı üzerinden yürür; ikinci bir fiyat motoru yoktur."
      actions={[
        { href: "/kurumsal-teklif" as Route, label: "Toptan teklif al" },
        { href: "/magaza" as Route, label: "Ürün gruplarını incele", variant: "outline" },
      ]}
    >
      <SectionHeading
        eyebrow="Kimin için"
        title="Perakende ve tekrarlı alım."
        description="Toptan bir ürün kategorisi değildir. Aşağıdaki kitleler için üretim teklifi hazırlanır."
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {audiences.map((item) => (
          <li key={item}>
            <ContentCard title={item} />
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Kapsam"
          title="Teklifte netleştirilenler."
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {offerPoints.map((item) => (
          <ContentCard key={item.title} title={item.title} description={item.body} />
        ))}
      </div>

      <p className="mt-8 text-sm leading-6 text-ink-secondary">
        Yazıcı sayısı, günlük kapasite, müşteri adedi, kâr marjı veya teslimat garantisi
        bu sayfada iddia edilmez. Paketleme seçenekleri yalnızca teklifte gerçekten
        sunulabiliyorsa yazılır.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={"/kurumsal-teklif" as Route} className={buttonVariants()}>
          Kurumsal brief’i aç
        </Link>
        {mailtoHref ? (
          <a href={mailtoHref} className={buttonVariants({ variant: "outline" })}>
            {siteConfig.contact.email}
          </a>
        ) : null}
      </div>
    </ContentPage>
  );
}
