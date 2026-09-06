"use client";

import { faqItems } from "@/components/home/faq-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
        <Accordion className="border-t border-white/10">
          {faqItems.map((item, index) => (
            <AccordionItem key={item.id} value={item.id} className="border-white/10">
              <AccordionTrigger className="rounded-none py-3.5 text-left text-base font-medium text-[#f3efe6] hover:no-underline">
                <span className="pr-4">
                  <span className="tabular mr-3 text-[0.875rem] text-cyan">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3.5 pl-10 text-base leading-7 text-white/80">
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
