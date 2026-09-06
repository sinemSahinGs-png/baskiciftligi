import { faqItems } from "@/components/home/faq-data";

export function CompactFaq() {
  const items = faqItems.slice(0, 4);

  return (
    <section
      id="sik-sorulanlar"
      data-home-theme="mono"
      className="hi-section"
      aria-labelledby="faq-heading"
    >
      <div className="hi-shell">
        <h2 id="faq-heading" className="hi-title">
          KISA SSS
        </h2>
        <div className="mt-5 border-t border-[color:var(--bc-line)]">
          {items.map((item, index) => (
            <details key={item.id} className="border-b border-[color:var(--bc-line)]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3">
                <span className="hi-mono w-8">{String(index + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-left text-sm font-semibold sm:text-base">
                  {item.question}
                </span>
                <span aria-hidden="true">+</span>
              </summary>
              <p className="pb-4 pl-10 text-sm leading-6 text-[color:var(--bc-muted)]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
