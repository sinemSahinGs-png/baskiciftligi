import { homepageDemoReviews, homepageTrustSignals } from "@/domain/home/homepage";
import { isDevelopmentDemoMode } from "@/lib/env";

export function SocialProofSection() {
  return (
    <section id="guven" className="home-section">
      <div className="home-shell">
        <h2 className="home-title home-mask-reveal">Güven unsurları</h2>
        <p className="home-lede">
          Müşteri yorumu yalnızca gerçek kayıt varsa gösterilir. Aşağıdakiler stüdyonun
          fiilen sunduğu güvencelerdir.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {homepageTrustSignals.map((item) => (
            <li key={item.title} className="home-card-paper p-4">
              <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-base leading-7 text-[#3d4148]">{item.description}</p>
            </li>
          ))}
        </ul>
        {isDevelopmentDemoMode ? (
          <div className="mt-6">
            <p className="text-[0.8125rem] font-semibold tracking-wide text-white/70 uppercase">
              Demo yorumlar — yayın kaydı değildir
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {homepageDemoReviews.map((review) => (
                <figure key={review.id} className="home-card-paper p-4">
                  <blockquote className="text-base leading-7">“{review.quote}”</blockquote>
                  <figcaption className="mt-2 text-[0.8125rem] text-[#3d4148]">
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
