"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { motionStagger, motionViewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function StaggerGrid({
  children,
  className,
  as: Tag = "div",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const { ready, reduced } = useScrollMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }
    const items = [...root.querySelectorAll<HTMLElement>("[data-motion-item]")];
    if (reduced || !ready) {
      for (const item of items) {
        item.dataset.motionItem = "visible";
      }
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      for (const item of items) {
        item.dataset.motionItem = "visible";
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const target = entry.target as HTMLElement;
          target.dataset.motionItem = "visible";
          observer.unobserve(target);
        }
      },
      { threshold: motionViewport.amount, rootMargin: motionViewport.margin },
    );

    items.forEach((item, index) => {
      item.dataset.motionItem = "idle";
      item.style.setProperty(
        "--motion-delay",
        `${delay + (index % 4) * motionStagger.item}s`,
      );
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, [children, delay, ready, reduced]);

  return (
    <Tag ref={ref as never} className={cn(className)}>
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <div
      className={cn("motion-item", className)}
      data-motion-item="idle"
      style={{ "--motion-delay": `${(index % 4) * motionStagger.item}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
