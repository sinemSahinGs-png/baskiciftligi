import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { SlotImage } from "@/components/home-industrial/slot-image";

export function CorporateProduction() {
  return (
    <section
      id="kurumsal-uretim"
      data-home-theme="mono"
      className="hi-section relative overflow-hidden"
      aria-labelledby="corporate-heading"
    >
      <div className="absolute inset-0">
        <SlotImage
          src="/images/home-industrial/printer-farm.avif"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-45"
        />
      </div>
      <div className="hi-shell relative py-8">
        <h2 id="corporate-heading" className="hi-title max-w-[12ch]">
          ÖLÇEKLENEBİLİR ÜRETİM<span className="hi-dot">.</span>
          <br />
          TEK ÜRETİM STANDARDI<span className="hi-dot">.</span>
        </h2>
        <p className="hi-lede">
          Tekrarlanabilir parti işleri, kontrollü kalite ve kurumsal teklif aynı üretim
          standardında yürür.
        </p>
        <HomeTrackLink
          event="corporate_cta_clicked"
          href={"/kurumsal-teklif" as Route}
          className="hi-btn mt-6"
        >
          Kurumsal teklif al →
        </HomeTrackLink>
      </div>
    </section>
  );
}
