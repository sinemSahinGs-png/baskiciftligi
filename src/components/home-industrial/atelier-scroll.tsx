"use client";

import { useEffect } from "react";

const RISE_SELECTOR = [
  ".atelier-num",
  ".atelier-kicker",
  ".atelier-title",
  ".atelier-lede",
  ".atelier-start-card",
  ".atelier-step-list li",
  ".atelier-detail-cards li",
  ".atelier-cta",
  ".atelier-cta-ghost",
  ".atelier-split-card",
  ".atelier-trust li",
  ".atelier-faq-item",
  ".hi-cats-project",
  ".octo-curated-card",
].join(",");

function inViewport(node: HTMLElement) {
  const box = node.getBoundingClientRect();
  return box.bottom > 40 && box.top < window.innerHeight * 0.9 && box.height > 0;
}

export function AtelierScrollMotion() {
  useEffect(() => {
    const root = document.querySelector(".atelier-world");
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>(RISE_SELECTOR)];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      nodes.forEach((node) => node.classList.add("atelier-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const node = entry.target as HTMLElement;
          node.classList.add("atelier-in");
          node.classList.remove("atelier-wait");
          observer.unobserve(node);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    nodes.forEach((node) => {
      const parent = node.parentElement;
      const index = parent ? Math.max(0, [...parent.children].indexOf(node)) : 0;
      node.style.setProperty("--rise-delay", `${Math.min(index, 6) * 70}ms`);
      if (inViewport(node)) {
        node.classList.add("atelier-in");
        return;
      }
      node.classList.add("atelier-wait");
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
