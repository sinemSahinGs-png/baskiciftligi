"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type UIEvent } from "react";
import { useReducedMotion } from "motion/react";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { CATEGORY_OBJECT_POSITION } from "@/components/home-industrial/category-crops";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";
import type { StorefrontCategorySlug } from "@/domain/catalog/storefront-taxonomy";
import type { Product } from "@/domain/catalog/types";
import { homepageStageCategories } from "@/domain/project-destinations/stage";
import { useTranslations } from "next-intl";

const STAGE_CATEGORIES = homepageStageCategories();

export function HomeCategories({ products }: { products: Product[] }) {
  void products;
  const t = useTranslations();
  const catName = (slug: string) => t(`categories.${slug}.name`);
  const catDesc = (slug: string) => t(`categories.${slug}.description`);
  const reduce = useReducedMotion() === true;
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerLock = useRef(false);
  const snapLock = useRef(false);
  const clickLockY = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const current = STAGE_CATEGORIES[active] ?? STAGE_CATEGORIES[0];
  const totalLabel = String(STAGE_CATEGORIES.length).padStart(2, "0");

  const go = useCallback((index: number) => {
    const bounded = (index + STAGE_CATEGORIES.length) % STAGE_CATEGORIES.length;
    snapLock.current = true;
    clickLockY.current = typeof window === "undefined" ? null : window.scrollY;
    setActive(bounded);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const section = sectionRef.current;
    if (!section) return;
    const syncFromPageScroll = () => {
      if (clickLockY.current !== null && Math.abs(window.scrollY - clickLockY.current) < 72) {
        return;
      }
      clickLockY.current = null;
      const box = section.getBoundingClientRect();
      const travel = Math.max(1, box.height - window.innerHeight * 0.62);
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.22 - box.top) / travel));
      const index = Math.min(
        STAGE_CATEGORIES.length - 1,
        Math.floor(progress * STAGE_CATEGORIES.length),
      );
      setActive((current) => (current === index ? current : index));
    };
    syncFromPageScroll();
    window.addEventListener("scroll", syncFromPageScroll, { passive: true });
    window.addEventListener("resize", syncFromPageScroll);
    return () => {
      window.removeEventListener("scroll", syncFromPageScroll);
      window.removeEventListener("resize", syncFromPageScroll);
    };
  }, [reduce]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !snapLock.current) return;
    const slide = track.querySelector<HTMLElement>(`.hi-cats-slide[data-index="${active}"]`);
    slide?.scrollIntoView({
      inline: "start",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
    const timer = window.setTimeout(() => {
      snapLock.current = false;
    }, reduce ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, [active, reduce]);

  function onIndexKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      pointerLock.current = true;
      go(active + 1);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      pointerLock.current = true;
      go(active - 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      pointerLock.current = true;
      go(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      pointerLock.current = true;
      go(STAGE_CATEGORIES.length - 1);
    }
  }

  function onTrackScroll(event: UIEvent<HTMLDivElement>) {
    if (snapLock.current) return;
    const track = event.currentTarget;
    const slides = [...track.querySelectorAll<HTMLElement>(".hi-cats-slide")];
    const origin = track.scrollLeft + track.clientWidth * 0.18;
    let next = 0;
    slides.forEach((slide, index) => {
      if (slide.offsetLeft <= origin) next = index;
    });
    setActive((currentIndex) => (currentIndex === next ? currentIndex : next));
  }

  return (
    <section
      ref={sectionRef}
      id="kategoriler"
      data-home-theme="abyss"
      data-cat-active={String(active).padStart(2, "0")}
      className="hi-section hi-cats atelier-panel atelier-cats"
      aria-labelledby="home-cats-heading"
    >
      <div className="hi-shell">
        <div className="hi-cats-head">
          <div>
            <p className="atelier-kicker">{t("home.catsKicker")}</p>
            <WordReveal as="h2" id="home-cats-heading" className="hi-title atelier-title" text={t("home.catsTitle")} />
          </div>
          <Link href={"/magaza" as Route} className="hi-link">
            {t("home.catsAll")}
          </Link>
        </div>

        <div className="hi-cats-stage mt-5">
          <div
            className="hi-cats-index"
            role="tablist"
            aria-label={t("home.catsIndex")}
            onKeyDown={onIndexKey}
          >
            {STAGE_CATEGORIES.map((category, index) => {
              const number = String(index + 1).padStart(2, "0");
              const selected = index === active;
              return (
                <button
                  key={category.slug}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  aria-label={
                    category.comingSoon
                      ? `${catName(category.slug)}, ${t("common.comingSoon")}`
                      : catName(category.slug)
                  }
                  data-category-slug={category.slug}
                  data-stage-kind={category.kind}
                  data-active={selected ? "true" : "false"}
                  data-coming-soon={category.comingSoon ? "true" : undefined}
                  className="hi-cats-index-item"
                  onMouseEnter={() => {
                    pointerLock.current = true;
                    go(index);
                  }}
                  onFocus={() => {
                    pointerLock.current = true;
                    go(index);
                  }}
                  onClick={() => {
                    pointerLock.current = true;
                    go(index);
                  }}
                >
                  <span className="hi-cats-index-num">{number}</span>
                  <span className="hi-cats-index-name">{catName(category.slug)}</span>
                  {category.comingSoon ? <span className="hi-cat-badge">{t("common.comingSoon")}</span> : null}
                </button>
              );
            })}
          </div>

          <div className="hi-cats-canvas">
            <span className="hi-cats-ghost hi-cats-ghost-prev" aria-hidden="true" />
            <span className="hi-cats-ghost hi-cats-ghost-next" aria-hidden="true" />

            <InteractiveMedia className="hi-cats-art">
              <div
                ref={trackRef}
                className="hi-cats-art-frame"
                onScroll={onTrackScroll}
              >
                {STAGE_CATEGORIES.map((category, index) => (
                  <span
                    key={category.slug}
                    className="hi-cats-slide"
                    data-active={index === active ? "true" : "false"}
                    data-index={index}
                    data-category-slug={category.slug}
                    data-stage-kind={category.kind}
                    data-coming-soon={category.comingSoon ? "true" : undefined}
                  >
                    <CategoryArtwork
                      src={category.artwork}
                      objectPosition={
                        category.kind === "octo"
                          ? CATEGORY_OBJECT_POSITION[category.slug as StorefrontCategorySlug]
                          : "50% 42%"
                      }
                      sizes="(max-width: 767px) 86vw, 58vw"
                    />
                    {category.logo ? (
                      <img className="hi-cats-slide-logo" src={category.logo} alt="" />
                    ) : null}
                    {category.comingSoon ? (
                      <span className="hi-cats-slide-badge">{t("common.comingSoon")}</span>
                    ) : null}
                  </span>
                ))}
                <span className="hi-cats-wire" aria-hidden="true" />
              </div>
            </InteractiveMedia>

            <div className="hi-cats-pager">
              <button
                type="button"
                aria-label={t("home.prevCat")}
                onClick={() => go(active - 1)}
              >
                ‹
              </button>
              <p className="hi-cats-pager-count">
                {String(active + 1).padStart(2, "0")} / {totalLabel}
              </p>
              <button
                type="button"
                aria-label={t("home.nextCat")}
                onClick={() => go(active + 1)}
              >
                ›
              </button>
            </div>

            {current ? (
              <div className="hi-cats-meta">
                <p className="hi-mono hi-cats-meta-count">
                  {String(active + 1).padStart(2, "0")} / {totalLabel}
                </p>
                <p className="hi-cats-meta-title">{catName(current.slug)}</p>
                <p className="hi-cats-meta-desc">{catDesc(current.slug)}</p>
                {current.comingSoon ? (
                  <span className="hi-cats-soon" aria-label={`${catName(current.slug)}, ${t("common.comingSoon")}`}>
                    {t("common.comingSoon")}
                  </span>
                ) : (
                  <Link href={current.href} className="hi-cats-cta" data-stage-kind={current.kind}>
                    {t("home.goCollection")}
                    <span className="hi-cat-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="hi-cats-handoff" aria-hidden="true">
        <span className="hi-cats-handoff-grid" />
        <span className="hi-cats-handoff-cyan" />
        <span className="hi-cats-handoff-orange" />
      </div>
    </section>
  );
}
