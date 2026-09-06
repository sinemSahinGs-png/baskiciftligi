import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";

export function FinalCtaSection() {
  return (
    <section id="basla" className="home-section">
      <div className="home-shell max-w-3xl">
        <h2 className="home-title home-mask-reveal">Bugün üretmeye başla.</h2>
        <p className="home-lede">
          Fikrini yaz, hazır model seç veya dosyanı yükle. Fiyat, gerçek üretim verisi olmadan vaat edilmez.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <a
            href="#ne-uretmek-istiyorsun"
            className="home-cta-press inline-flex min-h-12 items-center justify-center rounded-xl bg-orange px-5 text-[0.9375rem] font-semibold text-midnight"
          >
            Fikrini anlat
          </a>
          <HomeTrackLink
            event="ready_model_cta_clicked"
            href={"/hazir-modeller" as Route}
            className="home-cta-press inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-[0.9375rem] font-semibold"
          >
            Hazır model seç
          </HomeTrackLink>
          <HomeTrackLink
            event="upload_cta_clicked"
            href={"/model-yukle" as Route}
            className="home-cta-press inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-[0.9375rem] font-semibold"
          >
            Dosyanı yükle
          </HomeTrackLink>
        </div>
      </div>
    </section>
  );
}
