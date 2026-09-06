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
    <section id="sik-sorulanlar" className="bg-[#f4f1ea] py-12 scroll-mt-24 sm:py-16">
      <div className="home-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl">
            Kısa SSS
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-secondary">
            Dosya, fiyat ve kurumsal üretim. Detay isteyenler ilgili sayfaya geçer.
          </p>
        </div>
        <Accordion className="border-t border-black/10">
          {faqItems.map((item, index) => (
            <AccordionItem key={item.id} value={item.id} className="border-black/10">
              <AccordionTrigger className="rounded-none py-4 text-left text-base font-medium hover:no-underline">
                <span className="pr-4">
                  <span className="tabular mr-3 text-sm text-ink-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pl-10 text-sm leading-7 text-ink-secondary">
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
