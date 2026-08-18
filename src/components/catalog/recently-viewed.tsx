"use client";

import { useEffect, useSyncExternalStore } from "react";

import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { RevealHeading } from "@/components/motion/reveal-words";
import type { Product } from "@/domain/catalog/types";

const storageKey = "somut-recently-viewed";
const changeEvent = "somut-recently-viewed";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(storageKey) ?? "[]";
}

function getServerSnapshot() {
  return "[]";
}

function parseSlugs(raw: string) {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function trackRecentlyViewed(slug: string) {
  if (typeof window === "undefined") {
    return;
  }

  const current = parseSlugs(getSnapshot());
  const next = [slug, ...current.filter((item) => item !== slug)].slice(0, 8);
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new Event(changeEvent));
}

export function RecentlyViewed({ products }: { products: Product[] }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const slugs = parseSlugs(raw);
  const items = slugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="shell overflow-hidden py-10" aria-labelledby="son-gorulenler">
      <RevealHeading
        as="h2"
        id="son-gorulenler"
        text="Son baktıkların"
        className="section-title"
      />
      <div className="motion-mask-x mt-8">
        <CatalogGrid products={items.slice(0, 4)} />
      </div>
    </section>
  );
}

export function RecentlyViewedTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackRecentlyViewed(slug);
  }, [slug]);

  return null;
}
