"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { splitMotionWords } from "@/lib/motion";
import { cn } from "@/lib/utils";

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const show = () => {
      node.dataset.inview = "true";
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      show();
      return;
    }
    const box = node.getBoundingClientRect();
    const alreadyVisible =
      box.bottom > 0 && box.top < window.innerHeight && box.height > 0;
    if (alreadyVisible) {
      show();
      return;
    }
    node.dataset.inview = "false";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "80px 0px 80px 0px" },
    );
    observer.observe(node);
    const fallback = window.setTimeout(show, 900);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return ref;
}

export function SectionReveal({
  children,
  className,
  index,
}: {
  children: ReactNode;
  className?: string;
  index?: string;
}) {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("section-reveal", className)}>
      {index ? (
        <span className="section-reveal-index" aria-hidden="true">
          {index}
        </span>
      ) : null}
      <span className="section-reveal-line" aria-hidden="true" />
      {children}
    </div>
  );
}

export function WordReveal({
  text,
  as: Tag = "span",
  className,
  id,
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  id?: string;
}) {
  const ref = useInView<HTMLElement>();
  const parts = splitMotionWords(text);
  const tokens = parts.map((part, index) => ({
    key: `${index}-${part}`,
    part,
    wordI: /^\s+$/.test(part)
      ? null
      : parts.slice(0, index).filter((item) => !/^\s+$/.test(item)).length,
  }));

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={className}
      data-word-reveal=""
    >
      <span className="word-reveal">
        {tokens.map((token) =>
          token.wordI === null ? (
            <span key={token.key}>{token.part}</span>
          ) : (
            <span
              key={token.key}
              data-word=""
              style={{ "--word-i": token.wordI } as CSSProperties}
            >
              {token.part}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}

export function InteractiveMedia({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    let frame = 0;
    let x = 0.5;
    let y = 0.5;
    let pending = false;

    const paint = () => {
      pending = false;
      node.style.setProperty("--pointer-x", x.toFixed(3));
      node.style.setProperty("--pointer-y", y.toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      x = Math.min(1, Math.max(0, (event.clientX - box.left) / Math.max(box.width, 1)));
      y = Math.min(1, Math.max(0, (event.clientY - box.top) / Math.max(box.height, 1)));
      node.style.setProperty("--spot-opacity", "1");
      node.dataset.lit = "true";
      if (!pending) {
        pending = true;
        frame = window.requestAnimationFrame(paint);
      }
    };

    const onLeave = () => {
      node.style.setProperty("--spot-opacity", "0");
      node.dataset.lit = "false";
    };

    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      window.cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={cn("interactive-media", className)} {...props}>
      {children}
    </div>
  );
}

export function MagneticAction({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const dx = ((event.clientX - box.left) / box.width - 0.5) * 10;
      const dy = ((event.clientY - box.top) / box.height - 0.5) * 10;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        node.style.transform = `translate3d(${Math.max(-6, Math.min(6, dx))}px, ${Math.max(-6, Math.min(6, dy))}px, 0)`;
      });
    };
    const onLeave = () => {
      window.cancelAnimationFrame(frame);
      node.style.transform = "translate3d(0,0,0)";
    };
    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      window.cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={cn("magnetic-action", className)}>
      {children}
    </div>
  );
}

export function TechnicalDivider({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("technical-divider", className)} />;
}

export function ScrollProgress() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const root = document.documentElement;
    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const max = Math.max(1, root.scrollHeight - window.innerHeight);
        root.style.setProperty("--page-progress", String(window.scrollY / max));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}

export function ProductMediaReveal({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <InteractiveMedia className={cn("product-media-reveal", className)} {...props}>
      {children}
    </InteractiveMedia>
  );
}

export function useHeroPointer(ref: { current: HTMLElement | null }) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    let frame = 0;
    let x = 0.5;
    let y = 0.5;
    let pending = false;
    const paint = () => {
      pending = false;
      node.style.setProperty("--pointer-x", x.toFixed(3));
      node.style.setProperty("--pointer-y", y.toFixed(3));
    };
    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      x = (event.clientX - box.left) / Math.max(box.width, 1);
      y = (event.clientY - box.top) / Math.max(box.height, 1);
      if (!pending) {
        pending = true;
        frame = window.requestAnimationFrame(paint);
      }
    };
    node.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
    };
  }, [ref]);
}
