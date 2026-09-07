import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";

export function CorporateProduction() {
  return (
    <section
      id="kurumsal-uretim"
      data-home-theme="mono"
      className="hi-section hi-corporate relative overflow-hidden"
      aria-labelledby="corporate-heading"
    >
      <div className="hi-corporate-media" data-industrial-asset="printer-farm">
        <SlotImage
          src={industrialAssets.printerFarm}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[48%_42%]"
        />
      </div>
      <div className="hi-shell hi-corporate-copy">
        <h2 id="corporate-heading" className="hi-title max-w-[11ch]">
          ÖLÇEKLENEBİLİR ÜRETİM<span className="hi-dot">.</span>
          <br />
          TEK ÜRETİM STANDARDI<span className="hi-dot">.</span>
        </h2>
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
