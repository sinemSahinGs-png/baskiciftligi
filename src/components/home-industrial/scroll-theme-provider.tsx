"use client";

import { useEffect } from "react";

type ProofState = {
  depthLabel: string;
  depthMeters: string;
  depthProgress: number;
  portalFile: number;
  portalFind: number;
  portalFileTransform: string;
  storyStep: number;
  pathDashOffset: number;
  pathLength: number;
  categoryScrollLeft: number;
  footerRock: number;
  footerMid: number;
  footerFore: number;
  reducedMotion: boolean;
};

function sectionProgress(node: Element | null, vh: number) {
  if (!node) return 0;
  const box = node.getBoundingClientRect();
  const start = vh * 0.92;
  const end = vh * 0.18;
  return Math.max(0, Math.min(1, (start - box.top) / Math.max(1, start - end)));
}

export function ScrollThemeProvider() {
  useEffect(() => {
    const world = document.querySelector<HTMLElement>(".octo-world");
    const path = document.querySelector<SVGPathElement>(".octo-journey-stroke");
    const proof = document.querySelector<HTMLElement>("[data-octo-motion-proof]");
    const depthValue = document.querySelector<HTMLElement>("[data-octo-depth-value]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pathLength = 0;
    if (path) {
      try {
        pathLength = path.getTotalLength();
        path.style.strokeDasharray = String(pathLength);
        path.style.strokeDashoffset = reduce ? "0" : String(pathLength);
      } catch {
        pathLength = 0;
      }
    }

    let frame = 0;
    const update = () => {
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      const progress = Math.max(0, Math.min(1, window.scrollY / max));
      const portals = document.getElementById("nereden-baslamali");
      const story = document.getElementById("uc-uretim-yolu");
      const cats = document.getElementById("kategoriler");
      const universe = document.getElementById("octo-evreni");
      const footer = document.querySelector("[data-site-footer]");
      const portalFile = reduce ? 1 : sectionProgress(portals, vh);
      const portalFind = reduce
        ? 1
        : Math.max(0, Math.min(1, (portalFile - 0.42) / 0.58));
      const storyStep = Number(story?.getAttribute("data-octo-story-step") ?? "0");
      const categoryRail = document.querySelector<HTMLElement>("[data-category-rail]");
      const pathOffset = reduce || !pathLength ? 0 : pathLength * (1 - progress);

      let depthLabel = "YÜZEY";
      let depthMeters = "0 M";
      if (progress > 0.78 || (footer && footer.getBoundingClientRect().top < vh * 0.72)) {
        depthLabel = "DİP";
        depthMeters = "−32 M";
      } else if (
        (universe && universe.getBoundingClientRect().top < vh * 0.55) ||
        (cats && cats.getBoundingClientRect().top < vh * 0.55)
      ) {
        depthLabel = "KOLEKSİYON";
        depthMeters = "−24 M";
      } else if (
        (story && story.getBoundingClientRect().top < vh * 0.72) ||
        (portals && portals.getBoundingClientRect().top < vh * 0.78)
      ) {
        depthLabel = "ATÖLYE";
        depthMeters = "−08 M";
      }

      if (world) {
        world.style.setProperty("--octo-depth", progress.toFixed(4));
        world.style.setProperty("--octo-portal-file", portalFile.toFixed(4));
        world.style.setProperty("--octo-portal-find", portalFind.toFixed(4));
        world.style.setProperty("--octo-footer-rock", `${Math.round(progress * 5)}px`);
        world.style.setProperty("--octo-footer-mid", `${Math.round(progress * 10)}px`);
        world.style.setProperty("--octo-footer-fore", `${Math.round(progress * 16)}px`);
        world.dataset.octoDepthLabel = depthLabel;
        world.classList.add("octo-motion-ready");
      }
      document.documentElement.classList.add("octo-motion-ready");
      document.querySelectorAll("[data-portal]").forEach((node) => {
        const box = node.getBoundingClientRect();
        const visible = box.top < vh * 0.72 && box.bottom > vh * 0.28;
        node.classList.toggle("is-inview", visible);
      });
      document.querySelectorAll("[data-depth-stop]").forEach((node) => {
        const stop = node.getAttribute("data-depth-stop");
        const map: Record<string, string> = {
          surface: "YÜZEY",
          atelier: "ATÖLYE",
          collection: "KOLEKSİYON",
          floor: "DİP",
        };
        node.setAttribute("data-active", map[stop ?? ""] === depthLabel ? "true" : "false");
      });
      if (depthValue) depthValue.textContent = `${depthMeters} — ${depthLabel}`;
      if (path && pathLength && !reduce) {
        path.style.strokeDashoffset = String(pathOffset);
      }

      const fileObject = document.querySelector<HTMLElement>('[data-octo-portal-object="file"]');
      const proofState: ProofState = {
        depthLabel,
        depthMeters,
        depthProgress: Number(progress.toFixed(4)),
        portalFile: Number(portalFile.toFixed(4)),
        portalFind: Number(portalFind.toFixed(4)),
        portalFileTransform: fileObject ? getComputedStyle(fileObject).transform : "none",
        storyStep,
        pathDashOffset: Number(pathOffset.toFixed(2)),
        pathLength: Number(pathLength.toFixed(2)),
        categoryScrollLeft: Math.round(categoryRail?.scrollLeft ?? 0),
        footerRock: Math.round(progress * 5),
        footerMid: Math.round(progress * 10),
        footerFore: Math.round(progress * 16),
        reducedMotion: reduce,
      };
      if (proof) proof.textContent = JSON.stringify(proofState);
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    const raf = window.requestAnimationFrame(update);
    const later = window.setTimeout(update, 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", update);
    window.addEventListener("pageshow", update);
    window.addEventListener("popstate", update);
    window.addEventListener("load", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(later);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("pageshow", update);
      window.removeEventListener("popstate", update);
      window.removeEventListener("load", update);
    };
  }, []);

  return <pre hidden data-octo-motion-proof="" />;
}
