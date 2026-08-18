"use client";

import { faqItems } from "@/components/home/faq-data";
import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealHeading } from "@/components/motion/reveal-words";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  return (
    <section id="sik-sorulanlar" className="atmosphere-porcelain section-space-tight scroll-mt-24">
      <div className="shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <RevealHeading text="Karar vermeden önce" className="section-title" />
          <RevealCopy
            text="Dosya, malzeme ve üretim süreci. Özel bir gereksinim teklif formunda belirtilir."
            className="body-large mt-4 max-w-md"
          />
        </div>
        <div>
          <Accordion className="border-t border-hairline">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-hairline"
              >
                <AccordionTrigger className="rounded-none py-5 text-left text-base font-medium hover:no-underline">
                  <span className="pr-4">
                    <span className="tabular mr-3 text-sm text-ink-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-10 text-sm leading-7 text-ink-secondary">
                  <p>{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
