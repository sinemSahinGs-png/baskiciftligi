"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { CATEGORY_OBJECT_POSITION } from "@/components/home-industrial/category-crops";
import {
  storefrontCategories,
  type StorefrontCategory,
  type StorefrontCategorySlug,
} from "@/domain/catalog/storefront-taxonomy";
import { cn } from "@/lib/utils";

const OPEN_DELAY = 80;
const CLOSE_DELAY = 280;

export function StoreMegaMenu({
  inverted,
  categoryArtwork,
}: {
  inverted: boolean;
  categoryArtwork: Record<StorefrontCategorySlug, string | null>;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  function clearTimers() {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }

  function scheduleOpen() {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => setOpen(true), OPEN_DELAY);
  }

  function scheduleClose() {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY);
  }

  function openNow() {
    clearTimers();
    setOpen(true);
  }

  function closeNow() {
    clearTimers();
    setOpen(false);
  }

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeNow();
        rootRef.current?.querySelector<HTMLElement>("[data-mega-trigger]")?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeNow();
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closeNow uses refs
  }, [open]);

  function onTriggerKey(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openNow();
      window.setTimeout(() => itemRefs.current[0]?.focus(), 20);
    }
  }

  function onFinePointerEnter() {
    scheduleOpen();
  }

  function onFinePointerLeave() {
    scheduleClose();
  }

  function onRootPointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    onFinePointerEnter();
  }

  function onRootPointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    onFinePointerLeave();
  }

  function onRootBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      scheduleClose();
    }
  }

  function onItemKey(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = (index + 1) % storefrontCategories.length;
      setActive(next);
      itemRefs.current[next]?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = (index - 1 + storefrontCategories.length) % storefrontCategories.length;
      setActive(next);
      itemRefs.current[next]?.focus();
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
      itemRefs.current[0]?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = storefrontCategories.length - 1;
      setActive(last);
      itemRefs.current[last]?.focus();
    }
  }

  return (
    <div
      ref={rootRef}
      className="store-mega-root relative"
      onMouseEnter={onFinePointerEnter}
      onMouseLeave={onFinePointerLeave}
      onPointerEnter={onRootPointerEnter}
      onPointerLeave={onRootPointerLeave}
      onBlur={onRootBlur}
    >
      <Link
        href={"/magaza" as Route}
        data-mega-trigger=""
        data-active={open ? "true" : undefined}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        className="nav-signal inline-flex min-h-11 items-center px-3 text-sm font-medium"
        onFocus={scheduleOpen}
        onMouseEnter={onFinePointerEnter}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          onFinePointerEnter();
        }}
        onKeyDown={onTriggerKey}
      >
        Mağaza
        <span className="store-mega-underline" aria-hidden="true" />
      </Link>
      <div
        id={menuId}
        role="menu"
        data-open={open ? "true" : "false"}
        aria-hidden={open ? undefined : true}
        inert={open ? undefined : true}
        className={cn("store-mega", inverted && "store-mega-on-hero")}
        onMouseEnter={openNow}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          openNow();
        }}
      >
        <div className="store-mega-panel">
          <ul className="store-mega-grid">
            {storefrontCategories.map((category, index) => (
              <li key={category.slug}>
                <MegaItem
                  category={category}
                  artworkSrc={categoryArtwork[category.slug]}
                  active={active === index}
                  refFn={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  onFocus={() => setActive(index)}
                  onMouseEnter={() => setActive(index)}
                  onKeyDown={(event) => onItemKey(event, index)}
                />
              </li>
            ))}
          </ul>
          <aside className="store-mega-aside">
            <Link href={"/magaza" as Route} className="store-mega-aside-link" role="menuitem">
              Tüm ürünleri gör
            </Link>
            <Link
              href={"/magaza?siralama=newest" as Route}
              className="store-mega-aside-link"
              role="menuitem"
            >
              Yeni ürünler
            </Link>
            <Link href={"/toptan" as Route} className="store-mega-wholesale" role="menuitem">
              <span className="store-mega-wholesale-kicker">Ticari</span>
              Toptan & Bayiler
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MegaItem({
  category,
  artworkSrc,
  active,
  refFn,
  onFocus,
  onMouseEnter,
  onKeyDown,
}: {
  category: StorefrontCategory;
  artworkSrc: string | null;
  active: boolean;
  refFn: (node: HTMLAnchorElement | null) => void;
  onFocus: () => void;
  onMouseEnter: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      ref={refFn}
      href={category.href}
      role="menuitem"
      data-active={active ? "true" : "false"}
      className="store-mega-item"
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onKeyDown={onKeyDown}
      data-category-slug={category.slug}
    >
      <span className="store-mega-art" aria-hidden="true">
        <CategoryArtwork
          src={artworkSrc}
          sizes="72px"
          objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
        />
      </span>
      <span className="min-w-0">
        <span className="store-mega-name">{category.name}</span>
        {category.comingSoon ? (
          <span className="store-mega-soon">Hazırlanıyor</span>
        ) : null}
        <span className="store-mega-copy">{category.description}</span>
      </span>
    </Link>
  );
}

export function MobileStoreNav({
  onNavigate,
  categoryArtwork,
}: {
  onNavigate: () => void;
  categoryArtwork: Record<StorefrontCategorySlug, string | null>;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <li className="border-b border-hairline">
      <button
        type="button"
        className="flex min-h-14 w-full items-center justify-between font-heading text-[1.85rem] font-bold tracking-[-0.04em] sm:text-3xl"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        Mağaza
        <span aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open ? (
        <div id={panelId} className="pb-4">
          <Link
            href={"/magaza" as Route}
            className="flex min-h-11 items-center text-sm font-semibold"
            onClick={onNavigate}
          >
            Tüm ürünleri gör
          </Link>
          <ul className="mt-2 grid gap-1">
            {storefrontCategories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={category.href}
                  data-category-slug={category.slug}
                  className="store-mobile-cat"
                  onClick={onNavigate}
                >
                  <span className="store-mobile-cat-art" aria-hidden="true">
                    <CategoryArtwork
                      src={categoryArtwork[category.slug]}
                      sizes="40px"
                      objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{category.name}</span>
                    {category.comingSoon ? (
                      <span className="store-mega-soon">Hazırlanıyor</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={"/toptan" as Route}
            className="mt-3 flex min-h-11 items-center border-t border-white/10 pt-3 text-sm font-semibold text-[color:var(--shop-orange,#ff5a0a)]"
            onClick={onNavigate}
          >
            Toptan & Bayiler
          </Link>
        </div>
      ) : null}
    </li>
  );
}
