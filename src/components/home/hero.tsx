import Link from "next/link";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { BackgroundVideo } from "@/components/media/background-video";
import { homepageHeroCopy } from "@/domain/home/homepage";
import { getSiteContent } from "@/domain/site/content-repository";

export async function Hero() {
  const content = await getSiteContent();
  const copy = homepageHeroCopy;

  return (
    <section className="relative -mt-16 min-h-[100svh] overflow-hidden bg-midnight sm:-mt-[4.25rem]">
      <div className="absolute inset-0">
        <BackgroundVideo
          mp4Src={content.hero.videoUrl}
          webmSrc={content.hero.webmUrl}
          posterSrc={content.hero.posterUrl}
          overlayClassName="bg-[linear-gradient(105deg,rgb(7_7_19/0.72)_0%,rgb(64_84_255/0.22)_36%,rgb(7_7_19/0.18)_62%,rgb(255_101_66/0.12)_100%),linear-gradient(180deg,rgb(7_7_19/0.2)_0%,transparent_28%,rgb(7_7_19/0.78)_100%)]"
        />
      </div>
      <FoundryGrid variant="fade" className="opacity-55" />
      <div className="grid-text-veil pointer-events-none absolute inset-0" />
      <div className="shell relative z-10 flex min-h-[100svh] flex-col justify-end pb-10 pt-28 sm:pb-16 lg:justify-center lg:pt-32">
        <p className="eyebrow text-light-text">{content.hero.eyebrow}</p>
        <h1 className="display-title stack-title max-w-[16ch] text-light-text">
          {content.hero.headline}
        </h1>
        <p className="stack-body max-w-md text-[1.05rem] leading-7 text-muted-light">
          {content.hero.description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={copy.primaryCta.href}
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-coral px-7 text-sm font-semibold text-light-text"
          >
            {content.hero.primaryCtaLabel}
          </Link>
          <Link
            href={copy.secondaryCta.href}
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 px-7 text-sm font-semibold text-light-text"
          >
            {content.hero.secondaryCtaLabel}
          </Link>
        </div>
        <nav
          aria-label="Üretim yolları"
          className="mt-10 grid overflow-hidden rounded-md border border-white/12 bg-midnight/55 sm:grid-cols-3"
        >
          {copy.instruments.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-14 items-center gap-3 border-white/10 px-4 text-sm font-medium sm:border-l sm:px-5 sm:first:border-l-0 max-sm:border-t max-sm:first:border-t-0"
            >
              <span className="tabular text-cyan">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
