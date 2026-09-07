import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { MagneticAction, WordReveal } from "@/components/motion/premium";

export function FinalCta() {
  return (
    <section id="basla" data-home-theme="mono" className="hi-section hi-final" aria-labelledby="final-heading">
      <div className="hi-shell">
        <WordReveal as="h2" id="final-heading" className="hi-title" text="FİKRİN HAZIR MI?" />
        <p className="hi-lede">Hemen yükle, biz üretelim.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <MagneticAction className="w-fit">
            <HomeTrackLink
              event="upload_cta_clicked"
              href={"/model-yukle" as Route}
              className="hi-btn"
            >
              Modelini yükle →
            </HomeTrackLink>
          </MagneticAction>
          <HomeTrackLink
            event="corporate_cta_clicked"
            href={"/kurumsal-teklif" as Route}
            className="hi-btn hi-btn-ghost"
          >
            Kurumsal teklif al
          </HomeTrackLink>
        </div>
      </div>
    </section>
  );
}
