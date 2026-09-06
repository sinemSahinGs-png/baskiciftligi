import { faqItems } from "@/components/home/faq-data";

export function FaqSection() {
  return (
    <section id="sik-sorulanlar" className="home-section scroll-mt-24">
      <div className="home-shell grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="home-title home-mask-reveal">Kısa SSS</h2>
          <p className="home-lede">
            Dosya, fiyat ve kurumsal üretim. Detay isteyenler ilgili sayfaya geçer.
          </p>
        </div>
        <div className="border-t border-white/10">
          {faqItems.map((item, index) => (
            <details key={item.id} className="group border-b border-white/10">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between py-3.5 text-left text-base font-medium text-[#f3efe6] [&::-webkit-details-marker]:hidden">
                <span className="pr-4">
                  <span className="tabular mr-3 text-[0.875rem] text-cyan">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="text-white/50 transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-3.5 pl-10 text-base leading-7 text-white/80">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
