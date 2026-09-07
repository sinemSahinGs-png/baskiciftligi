import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { MagneticAction, WordReveal } from "@/components/motion/premium";

export function WholesaleBand() {
  return (
    <section
      id="toptan-bayiler"
      data-home-theme="mono"
      className="hi-section hi-wholesale"
      aria-labelledby="wholesale-heading"
    >
      <div className="hi-shell hi-wholesale-layout">
        <p className="hi-kicker">TOPTAN & BAYİLER</p>
        <WordReveal
          as="h2"
          id="wholesale-heading"
          className="hi-title max-w-[14ch]"
          text="RAFINDA HIZLI SATILACAK ÜRÜNLER."
        />
        <p className="hi-lede">
          Hediyelik, konsept mağaza, etkinlik ve kurumsal alımlar için adet bazlı
          teklif. Toptan bir kategori değildir; mevcut kurumsal brief hattı kullanılır.
        </p>
        <div className="hi-wholesale-actions">
          <MagneticAction className="w-fit">
            <HomeTrackLink
              event="corporate_cta_clicked"
              href={"/toptan" as Route}
              className="hi-btn"
            >
              TOPTAN TEKLİF AL
            </HomeTrackLink>
          </MagneticAction>
          <HomeTrackLink
            href={"/magaza" as Route}
            className="hi-link"
          >
            ÜRÜN GRUPLARINI İNCELE →
          </HomeTrackLink>
        </div>
      </div>
    </section>
  );
}
