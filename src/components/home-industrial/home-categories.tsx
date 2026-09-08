"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { CATEGORY_OBJECT_POSITION } from "@/components/home-industrial/category-crops";
import { InteractiveMedia, WordReveal } from "@/components/motion/premium";
import { storefrontCategories, storefrontCategoryAsset } from "@/domain/catalog/storefront-taxonomy";
import type { Product } from "@/domain/catalog/types";

export function HomeCategories({ products }: { products: Product[] }) {
  void products;
  const reduce = useReducedMotion() === true;
  const sectionRef = useRef<HTMLElement>(null);
  const pointerLock = useRef(false);
  const [active, setActive] = useState(0);
  const current = storefrontCategories[active] ?? storefrontCategories[0];

  const go = useCallback((index: number) => {
    const bounded = (index + storefrontCategories.length) % storefrontCategories.length;
    setActive(bounded);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || reduce) return;
    let frame = 0;
    const onScroll = () => {
      if (pointerLock.current) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const box = node.getBoundingClientRect();
        const span = box.height + window.innerHeight * 0.35;
        const raw = Math.min(0.999, Math.max(0, (window.innerHeight * 0.55 - box.top) / span));
        const nextIndex = Math.min(storefrontCategories.length - 1, Math.floor(raw * storefrontCategories.length));
        setActive((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduce]);

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

  function onSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = event.clientX;
    const target = event.currentTarget;
    const up = (end: PointerEvent<HTMLDivElement>) => {
      const dx = end.clientX - start;
      if (dx < -36) go(active + 1);
      if (dx > 36) go(active - 1);
      target.releasePointerCapture(end.pointerId);
      target.removeEventListener("pointerup", up as never);
    };
    target.setPointerCapture(event.pointerId);
    target.addEventListener("pointerup", up as never, { once: true });
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
            <p className="hi-kicker">3D TASARIM DİZİNİ</p>
            <WordReveal as="h2" id="home-cats-heading" className="hi-title" text="KATEGORİLER" />
          </div>
          <Link href={"/magaza" as Route} className="hi-link">
            Tümünü gör →
          </Link>
        </div>

        <div className="hi-cats-stage mt-5">
          <div
            className="hi-cats-index"
            role="tablist"
            aria-label="Kategori dizini"
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
                      ? `${category.name}, yakında`
                      : category.name
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
                  <span className="hi-cats-index-name">{category.name}</span>
                  {category.comingSoon ? <span className="hi-cat-badge">Hazırlanıyor</span> : null}
                </button>
              );
            })}
          </div>

          <div className="hi-cats-canvas" onPointerDown={onSwipe}>
            <span className="hi-cats-ghost hi-cats-ghost-prev" aria-hidden="true" />
            <span className="hi-cats-ghost hi-cats-ghost-next" aria-hidden="true" />

            <InteractiveMedia className="hi-cats-art">
              <div className="hi-cats-art-frame">
                {storefrontCategories.map((category, index) => (
                  <span
                    key={category.slug}
                    className="hi-cats-slide"
                    data-active={index === active ? "true" : "false"}
                    data-category-slug={category.slug}
                  >
                    <CategoryArtwork
                      src={storefrontCategoryAsset(category.slug)}
                      objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
                      sizes="(max-width: 767px) 100vw, 58vw"
                    />
                  </span>
                ))}
                <span className="hi-cats-wire" aria-hidden="true" />
              </div>
            </InteractiveMedia>

            {current ? (
              <div className="hi-cats-meta">
                <p className="hi-mono">{String(active + 1).padStart(2, "0")} / 07</p>
                <p className="hi-cats-meta-title">{current.name}</p>
                <p className="hi-cats-meta-desc">{current.description}</p>
                {current.comingSoon ? (
                  <span className="hi-cats-soon" aria-label={`${current.name}, yakında`}>
                    Hazırlanıyor
                  </span>
                ) : (
                  <Link href={current.href} className="hi-cats-cta">
                    Koleksiyona git
                    <span className="hi-cat-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="hi-cats-rail" aria-hidden="false">
          {storefrontCategories.map((category, index) => (
            <button
              key={`${category.slug}-rail`}
              type="button"
              className="hi-cats-rail-item"
              data-active={index === active ? "true" : "false"}
              onClick={() => {
                pointerLock.current = true;
                go(index);
              }}
            >
              {String(index + 1).padStart(2, "0")} {category.name}
            </button>
          ))}
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
