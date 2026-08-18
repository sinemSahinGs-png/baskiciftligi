"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { m, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { FormSignal } from "@/components/brand/form-signal";
import { FoundryGrid } from "@/components/brand/foundry-grid";
import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealWords } from "@/components/motion/reveal-words";
import { MotionScope } from "@/components/motion/motion-scope";
import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { BackgroundVideo } from "@/components/media/background-video";
import { homepageHeroCopy } from "@/domain/home/homepage";
import { siteConfig } from "@/config/site";

export function Hero() {
  const { reduced, allowParallax } = useScrollMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], [0, allowParallax ? 48 : 0]);
  const mediaScale = useTransform(
    scrollYProgress,
    [0, 1],
    allowParallax ? [1, 1.04] : [1, 1],
  );
  const cobalt = useTransform(scrollYProgress, [0, 1], allowParallax ? [0.28, 0.08] : [0.22, 0.22]);
  const coral = useTransform(scrollYProgress, [0, 1], allowParallax ? [0.12, 0.32] : [0.16, 0.16]);
  const copy = homepageHeroCopy;

  return (
    <section
      ref={sectionRef}
      className="relative -mt-16 min-h-[100svh] overflow-hidden bg-midnight sm:-mt-[4.25rem]"
    >
      <m.div style={{ scale: mediaScale }} className="absolute inset-0 origin-center">
        <BackgroundVideo
          mp4Src={siteConfig.hero.videoUrl}
          webmSrc={siteConfig.hero.webmUrl}
          posterSrc={siteConfig.hero.posterUrl}
          overlayClassName="bg-[linear-gradient(105deg,rgb(7_7_19/0.72)_0%,rgb(64_84_255/0.28)_36%,rgb(7_7_19/0.18)_62%,rgb(255_101_66/0.16)_100%),linear-gradient(180deg,rgb(7_7_19/0.2)_0%,transparent_28%,rgb(7_7_19/0.78)_100%)]"
        />
      </m.div>
      <m.div
        aria-hidden="true"
        style={{ opacity: cobalt }}
        className="pointer-events-none absolute inset-0 bg-cobalt mix-blend-soft-light"
      />
      <m.div
        aria-hidden="true"
        style={{ opacity: coral }}
        className="pointer-events-none absolute inset-0 bg-coral mix-blend-soft-light"
      />
      <FoundryGrid variant="fade" className="opacity-70" />
      <m.div
        aria-hidden="true"
        style={{ y: gridY }}
        className="absolute inset-0 max-md:hidden"
      >
        <FoundryGrid variant="perspective" />
      </m.div>
      <div className="grid-text-veil absolute inset-0" />
      <MotionScope className="shell relative z-10 flex min-h-[100svh] flex-col justify-end pb-10 pt-28 sm:pb-16 lg:justify-center lg:pt-32">
        <p className="eyebrow text-light-text" data-motion-line="idle">
          <span className="motion-line">{copy.eyebrow}</span>
        </p>
        <RevealWords
          as="h1"
          text={copy.headline.replace("\n", " ")}
          className="display-title stack-title max-w-[16ch] text-light-text"
        />
        <RevealCopy
          text={copy.description}
          className="stack-body max-w-md text-[1.05rem] leading-7 text-muted-light"
        />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={copy.primaryCta.href}
            className="motion-item inline-flex min-h-12 items-center justify-center rounded-md bg-coral px-7 text-sm font-semibold text-light-text"
            data-motion-item="idle"
            style={{ "--motion-delay": "0.18s" } as CSSProperties}
          >
            {copy.primaryCta.label}
          </Link>
          <Link
            href={copy.secondaryCta.href}
            className="motion-item inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 px-7 text-sm font-semibold text-light-text"
            data-motion-item="idle"
            style={{ "--motion-delay": "0.26s" } as CSSProperties}
          >
            {copy.secondaryCta.label}
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
              data-motion-item="idle"
              className="motion-item flex min-h-14 items-center gap-3 border-white/10 px-4 text-sm font-medium sm:border-l sm:px-5 sm:first:border-l-0 max-sm:border-t max-sm:first:border-t-0"
              style={{ "--motion-delay": `${0.32 + index * 0.08}s` } as CSSProperties}
            >
              <span className="tabular text-cyan">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </MotionScope>
      <a
        href="#one-cikan-urunler"
        className="absolute right-5 bottom-8 z-10 flex flex-col items-center gap-2 text-light-text max-sm:bottom-28"
      >
        <FormSignal spinning={!reduced} className="size-5" />
        <span className="sr-only">Öne çıkan ürünlere in</span>
      </a>
    </section>
  );
}
