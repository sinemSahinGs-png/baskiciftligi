import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { InteractiveMedia, MagneticAction, WordReveal } from "@/components/motion/premium";

const POINTS = [
  "Aynı üretim standardı her parçada.",
  "Fiyat, dilimleme çıktısı olmadan vaat edilmez.",
  "Kurumsal işler için ayrı teklif hattı.",
] as const;

export function CorporateProduction() {
  return (
    <section
      id="kurumsal-uretim"
      data-home-theme="mono"
      className="hi-section hi-corporate relative overflow-hidden"
      aria-labelledby="corporate-heading"
    >
      <InteractiveMedia className="hi-corporate-media" data-industrial-asset="printer-farm">
        <SlotImage
          src={industrialAssets.printerFarm}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <span className="hi-corporate-sweep" aria-hidden="true" />
      </InteractiveMedia>
      <div className="hi-shell hi-corporate-copy">
        <WordReveal
          as="h2"
          id="corporate-heading"
          className="hi-title max-w-[12ch]"
          text="ÖLÇEKLENEBİLİR ÜRETİM. TEK ÜRETİM STANDARDI."
        />
        <ul className="hi-corporate-points">
          {POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <MagneticAction className="mt-6 w-fit">
          <HomeTrackLink
            event="corporate_cta_clicked"
            href={"/kurumsal-teklif" as Route}
            className="hi-btn"
          >
            Kurumsal teklif al →
          </HomeTrackLink>
        </MagneticAction>
      </div>
    </section>
  );
}
