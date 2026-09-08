import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { homepageCorporateOffers } from "@/domain/home/homepage";

export function B2bSection() {
  return (
    <section id="kurumsal-uretim" className="home-section relative overflow-hidden">
      <div className="home-shell relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-[0.8125rem] font-semibold tracking-[0.16em] text-orange uppercase">
            Kurumsal üretim
          </p>
          <h2 className="home-title home-mask-reveal mt-2">
            Tekrarlanabilir üretim, kontrollü kapasite.
          </h2>
          <ul className="mt-4 space-y-1.5 text-base leading-7 text-white/80">
            <li>Çoklu yazıcı ile parti işleri</li>
            <li>Numune ve seri üretim aynı süreçte</li>
            <li>Dosya yalnızca üretim değerlendirmesi için işlenir</li>
          </ul>
          <HomeTrackLink
            event="corporate_cta_clicked"
            href={"/kurumsal-uretim#brief" as Route}
            className="home-cta-press mt-5 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-[0.9375rem] font-semibold text-midnight"
          >
            Kurumsal teklif al
          </HomeTrackLink>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/10 sm:grid-cols-2">
          {homepageCorporateOffers.slice(0, 4).map((item) => (
            <li key={item.title} className="bg-[#141a21] p-4">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-[0.875rem] leading-6 text-white/75">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
