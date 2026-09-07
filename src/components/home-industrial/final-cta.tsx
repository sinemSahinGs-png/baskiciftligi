import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";

export function FinalCta() {
  return (
    <section id="basla" data-home-theme="mono" className="hi-section hi-final" aria-labelledby="final-heading">
      <div className="hi-shell">
        <h2 id="final-heading" className="hi-title">
          FİKRİN HAZIR MI<span className="hi-dot">?</span>
        </h2>
        <p className="hi-lede">Hemen yükle, biz üretelim.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <HomeTrackLink
            event="upload_cta_clicked"
            href={"/model-yukle" as Route}
            className="hi-btn"
          >
            Modelini yükle →
          </HomeTrackLink>
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
