"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type UIEvent } from "react";
import { useReducedMotion } from "motion/react";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { CATEGORY_OBJECT_POSITION } from "@/components/home-industrial/category-crops";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";
import { storefrontCategories, storefrontCategoryAsset } from "@/domain/catalog/storefront-taxonomy";
import type { Product } from "@/domain/catalog/types";
import { useTranslations } from "next-intl";

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
  const [active, setActive] = useState(0);
  const current = storefrontCategories[active] ?? storefrontCategories[0];

  const go = useCallback((index: number) => {
    const bounded = (index + storefrontCategories.length) % storefrontCategories.length;
    snapLock.current = true;
    setActive(bounded);
  }, []);

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
      go(storefrontCategories.length - 1);
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
      data-home-theme="mono"
      data-cat-active={String(active).padStart(2, "0")}
      className="hi-section hi-cats"
      aria-labelledby="home-cats-heading"
    >
      <div className="hi-shell">
        <div className="hi-cats-head">
          <div>
            <p className="hi-kicker">{t("home.catsKicker")}</p>
            <WordReveal as="h2" id="home-cats-heading" className="hi-title" text={t("home.catsTitle")} />
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
            {storefrontCategories.map((category, index) => {
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
                {storefrontCategories.map((category, index) => (
                  <span
                    key={category.slug}
                    className="hi-cats-slide"
                    data-active={index === active ? "true" : "false"}
                    data-index={index}
                    data-category-slug={category.slug}
                    data-coming-soon={category.comingSoon ? "true" : undefined}
                  >
                    <CategoryArtwork
                      src={storefrontCategoryAsset(category.slug)}
                      objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
                      sizes="(max-width: 767px) 86vw, 58vw"
                    />
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
                {String(active + 1).padStart(2, "0")} / 07
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
                  {String(active + 1).padStart(2, "0")} / 07
                </p>
                <p className="hi-cats-meta-title">{catName(current.slug)}</p>
                <p className="hi-cats-meta-desc">{catDesc(current.slug)}</p>
                {current.comingSoon ? (
                  <span className="hi-cats-soon" aria-label={`${catName(current.slug)}, ${t("common.comingSoon")}`}>
                    {t("common.comingSoon")}
                  </span>
                ) : (
                  <Link href={current.href} className="hi-cats-cta">
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
