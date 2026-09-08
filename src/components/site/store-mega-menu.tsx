"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

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
const VIEWPORT_GUTTER = 16;
const MEGA_MAX_WIDTH = 880;

function subscribeNever() {
  return () => {};
}

function clientSnapshot() {
  return true;
}

function serverSnapshot() {
  return false;
}

export function StoreMegaMenu({
  inverted,
  categoryArtwork,
}: {
  inverted: boolean;
  categoryArtwork: Record<StorefrontCategorySlug, string | null>;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const liveCategories = storefrontCategories.filter((item) => !item.comingSoon);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const wholesaleRef = useRef<HTMLAnchorElement | null>(null);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const isClient = useSyncExternalStore(subscribeNever, clientSnapshot, serverSnapshot);
  const ignoreTriggerFocus = useRef(false);

  function isMegaNode(node: EventTarget | null) {
    if (!node || !(node instanceof Node)) return false;
    return Boolean(rootRef.current?.contains(node) || panelRef.current?.contains(node));
  }

  function updatePlacement() {
    const node = panelRef.current;
    const header = rootRef.current?.closest("header") ?? document.querySelector("header");
    if (!node || !header) return;
    const viewportWidth = window.innerWidth;
    const headerBox = header.getBoundingClientRect();
    const shell = header.querySelector(".shell");
    const shellBox = shell?.getBoundingClientRect();
    const width = Math.min(MEGA_MAX_WIDTH, viewportWidth - VIEWPORT_GUTTER * 2);
    let right = VIEWPORT_GUTTER;
    if (shellBox) {
      right = Math.max(VIEWPORT_GUTTER, viewportWidth - shellBox.right);
    }
    const left = viewportWidth - right - width;
    if (left < VIEWPORT_GUTTER) {
      right = Math.max(VIEWPORT_GUTTER, viewportWidth - VIEWPORT_GUTTER - width);
    }
    node.style.top = `${Math.round(headerBox.bottom)}px`;
    node.style.right = `${Math.round(right)}px`;
  }

  function clearTimers() {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }

  function scheduleOpen() {
    if (ignoreTriggerFocus.current) return;
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

  useLayoutEffect(() => {
    if (!isClient) return;
    updatePlacement();
    const header = rootRef.current?.closest("header") ?? document.querySelector("header");
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, { passive: true });
    const observer = header ? new ResizeObserver(updatePlacement) : null;
    if (header && observer) observer.observe(header);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement);
      observer?.disconnect();
    };
  }, [isClient, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        ignoreTriggerFocus.current = true;
        closeNow();
        rootRef.current?.querySelector<HTMLElement>("[data-mega-trigger]")?.focus();
        window.setTimeout(() => {
          ignoreTriggerFocus.current = false;
        }, OPEN_DELAY + 40);
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!isMegaNode(event.target)) closeNow();
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
    if (isMegaNode(event.relatedTarget)) return;
    onFinePointerLeave();
  }

  function onPanelPointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (isMegaNode(event.relatedTarget)) return;
    onFinePointerLeave();
  }

  function onMegaBlur(event: FocusEvent<HTMLDivElement>) {
    if (isMegaNode(event.relatedTarget)) return;
    scheduleClose();
  }

  function onItemKey(event: KeyboardEvent<HTMLAnchorElement>, liveIndex: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (liveIndex === liveCategories.length - 1) {
        focusWholesale();
        return;
      }
      const next = liveIndex + 1;
      setActive(next);
      itemRefs.current[next]?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = (liveIndex - 1 + liveCategories.length) % liveCategories.length;
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
      focusWholesale();
    }
  }

  function focusWholesale() {
    wholesaleRef.current?.focus();
  }

  function onWholesaleKey(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const last = liveCategories.length - 1;
      setActive(last);
      itemRefs.current[last]?.focus();
    }
    if (event.key === "ArrowDown" || event.key === "Home") {
      event.preventDefault();
      setActive(0);
      itemRefs.current[0]?.focus();
    }
  }

  const panel = (
    <div
      ref={panelRef}
      id={menuId}
      role="menu"
      data-open={open ? "true" : "false"}
      data-mega-anchor="header-shell"
      aria-hidden={open ? undefined : true}
      inert={open ? undefined : true}
      className={cn("store-mega", inverted && "store-mega-on-hero")}
      onMouseEnter={openNow}
      onMouseLeave={(event) => {
        if (isMegaNode(event.relatedTarget)) return;
        onFinePointerLeave();
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        openNow();
      }}
      onPointerLeave={onPanelPointerLeave}
      onBlur={onMegaBlur}
      onKeyDown={(event) => {
        if (event.key === "End") {
          event.preventDefault();
          focusWholesale();
        }
      }}
    >
      <div className="store-mega-panel">
        <ul className="store-mega-grid">
          {storefrontCategories.map((category) => {
            const liveIndex = liveCategories.findIndex((item) => item.slug === category.slug);
            return (
              <li key={category.slug}>
                {category.comingSoon || liveIndex < 0 ? (
                  <MegaSoonItem
                    category={category}
                    artworkSrc={categoryArtwork[category.slug]}
                  />
                ) : (
                  <MegaItem
                    category={category}
                    artworkSrc={categoryArtwork[category.slug]}
                    active={active === liveIndex}
                    refFn={(node) => {
                      itemRefs.current[liveIndex] = node;
                    }}
                    onFocus={() => setActive(liveIndex)}
                    onMouseEnter={() => setActive(liveIndex)}
                    onKeyDown={(event) => onItemKey(event, liveIndex)}
                  />
                )}
              </li>
            );
          })}
        </ul>
        <aside className="store-mega-aside">
          <p className="store-mega-wholesale-kicker">Ticari hat</p>
          <p className="store-mega-wholesale-lede">
            Tekrarlanabilir seri üretim ve bayi tedariki.
          </p>
          <Link
            ref={(node) => {
              wholesaleRef.current = node;
            }}
            href={"/toptan" as Route}
            className="store-mega-wholesale"
            role="menuitem"
            onKeyDown={onWholesaleKey}
          >
            Toptan & Bayiler
          </Link>
        </aside>
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="store-mega-root relative flex h-full items-center"
      onMouseEnter={onFinePointerEnter}
      onMouseLeave={(event) => {
        if (isMegaNode(event.relatedTarget)) return;
        onFinePointerLeave();
      }}
      onPointerEnter={onRootPointerEnter}
      onPointerLeave={onRootPointerLeave}
      onBlur={onMegaBlur}
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
      {isClient ? createPortal(panel, document.body) : null}
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
          sizes="80px"
          objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
        />
      </span>
      <span className="min-w-0">
        <span className="store-mega-name">{category.name}</span>
        <span className="store-mega-copy">{category.description}</span>
      </span>
    </Link>
  );
}

function MegaSoonItem({
  category,
  artworkSrc,
}: {
  category: StorefrontCategory;
  artworkSrc: string | null;
}) {
  return (
    <div
      className="store-mega-item store-mega-item-soon"
      aria-disabled="true"
      aria-label={`${category.name}, yakında`}
      data-category-slug={category.slug}
      data-coming-soon="true"
    >
      <span className="store-mega-art" aria-hidden="true">
        <CategoryArtwork
          src={artworkSrc}
          sizes="80px"
          objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
        />
      </span>
      <span className="min-w-0">
        <span className="store-mega-name">{category.name}</span>
        <span className="store-mega-soon">Yakında</span>
        <span className="store-mega-copy">{category.description}</span>
      </span>
    </div>
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
          <ul className="store-mobile-cat-grid">
            {storefrontCategories.map((category) => (
              <li key={category.slug}>
                {category.comingSoon ? (
                  <div
                    className="store-mobile-cat store-mobile-cat-soon"
                    aria-disabled="true"
                    aria-label={`${category.name}, yakında`}
                    data-category-slug={category.slug}
                    data-coming-soon="true"
                  >
                    <span className="store-mobile-cat-art" aria-hidden="true">
                      <CategoryArtwork
                        src={categoryArtwork[category.slug]}
                        sizes="72px"
                        objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
                      />
                    </span>
                    <span className="store-mobile-cat-copy">
                      <span className="store-mobile-cat-name">{category.name}</span>
                      <span className="store-mega-soon">Yakında</span>
                    </span>
                  </div>
                ) : (
                  <Link
                    href={category.href}
                    data-category-slug={category.slug}
                    className="store-mobile-cat"
                    onClick={onNavigate}
                  >
                    <span className="store-mobile-cat-art" aria-hidden="true">
                      <CategoryArtwork
                        src={categoryArtwork[category.slug]}
                        sizes="72px"
                        objectPosition={CATEGORY_OBJECT_POSITION[category.slug]}
                      />
                    </span>
                    <span className="store-mobile-cat-copy">
                      <span className="store-mobile-cat-name">{category.name}</span>
                    </span>
                    <span className="store-mobile-cat-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}
