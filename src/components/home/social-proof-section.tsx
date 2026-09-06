"use client";

import { homepageDemoReviews, homepageTrustSignals } from "@/domain/home/homepage";
import { isDevelopmentDemoMode } from "@/lib/env";

export function SocialProofSection() {
  return (
    <section id="guven" className="bg-[#f4f1ea] py-12 sm:py-16">
      <div className="home-shell">
        <h2 className="font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl">
          Güven unsurları
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-ink-secondary">
          Müşteri yorumu yalnızca gerçek kayıt varsa gösterilir. Aşağıdakiler stüdyonun
          fiilen sunduğu güvencelerdir.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {homepageTrustSignals.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-black/8 bg-white p-4"
            >
              <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">{item.description}</p>
            </li>
          ))}
        </ul>
        {isDevelopmentDemoMode ? (
          <div className="mt-10">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              Demo yorumlar — yayın kaydı değildir
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {homepageDemoReviews.map((review) => (
                <figure key={review.id} className="rounded-2xl bg-white p-4">
                  <blockquote className="text-sm leading-6">“{review.quote}”</blockquote>
                  <figcaption className="mt-3 text-xs text-ink-muted">
                    {review.name}, {review.city} · Demo
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
