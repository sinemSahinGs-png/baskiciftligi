"use client";

import { useEffect } from "react";

type ProofState = {
  depthLabel: string;
  depthMeters: string;
  depthProgress: number;
  portalFile: number;
  portalFind: number;
  portalWire: number;
  portalFinish: number;
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function sectionProgress(node: Element | null, vh: number) {
  if (!node) return 0;
  const box = node.getBoundingClientRect();
  const start = vh * 0.92;
  const end = vh * 0.18;
  return clamp01((start - box.top) / Math.max(1, start - end));
}

function portalPhases(progress: number, reduce: boolean) {
  const p = reduce ? 1 : clamp01(progress);
  const wire = p <= 0.38 ? 1 : p >= 0.52 ? 0 : 1 - (p - 0.38) / 0.14;
  const finish = p <= 0.58 ? 0 : clamp01((p - 0.58) / 0.42);
  const material = p < 0.22 ? 0 : p < 0.48 ? (p - 0.22) / 0.26 : p < 0.62 ? 1 - (p - 0.48) / 0.14 : 0;
  return {
    progress: p,
    wire: clamp01(wire),
    material: clamp01(material),
    finish: clamp01(finish),
  };
}

const HASH_HEADINGS: Record<string, string> = {
  "nereden-baslamali": "start-path-heading",
  "uc-uretim-yolu": "story-heading",
  kategoriler: "home-cats-heading",
  "octo-evreni": "universe-heading",
  "mevcut-urunler": "curated-heading",
  "toptan-bayiler": "wholesale-heading",
  "sik-sorulanlar": "faq-heading",
  atolye: "start-path-heading",
};

function vis(value: number) {
  return value > 0.04 ? "visible" : "hidden";
}

function alignHash() {
  const id = window.location.hash.replace("#", "");
  if (!id) return;
  const headingId = HASH_HEADINGS[id];
  const el = (headingId && document.getElementById(headingId)) || document.getElementById(id);
  if (!el) return;
  const header = document.querySelector("header");
  const headerH = header?.getBoundingClientRect().height ?? 56;
  const desired = headerH + window.innerHeight * 0.18;
  const top = el.getBoundingClientRect().top + window.scrollY - desired;
  window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
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
      const wholesale = document.getElementById("toptan-bayiler");
      const filePortal = document.querySelector("[data-portal='file']");
      const portalFile = reduce ? 1 : sectionProgress(filePortal ?? portals, vh);
      const phases = portalPhases(portalFile, reduce);
      const portalFind = reduce ? 1 : clamp01((sectionProgress(portals, vh) - 0.42) / 0.58);
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
        world.style.setProperty("--octo-portal-file", phases.progress.toFixed(4));
        world.style.setProperty("--portal-wire", phases.wire.toFixed(4));
        world.style.setProperty("--portal-material", phases.material.toFixed(4));
        world.style.setProperty("--portal-finish", phases.finish.toFixed(4));
        world.style.setProperty("--portal-wire-vis", vis(phases.wire));
        world.style.setProperty("--portal-material-vis", vis(phases.material));
        world.style.setProperty("--portal-finish-vis", vis(phases.finish));
        world.style.setProperty("--octo-portal-find", portalFind.toFixed(4));
        world.style.setProperty("--universe-rise", sectionProgress(universe, vh).toFixed(4));
        world.style.setProperty(
          "--wholesale-shift",
          `${Math.round(sectionProgress(wholesale, vh) * 16)}px`,
        );
        world.style.setProperty("--octo-footer-rock", `${Math.round(progress * 6)}px`);
        world.style.setProperty("--octo-footer-mid", `${Math.round(progress * 10)}px`);
        world.style.setProperty("--octo-footer-fore", `${Math.round(progress * 14)}px`);
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

      const fileObject = document.querySelector<HTMLElement>("[data-portal-layer='wire']");
      const proofState: ProofState = {
        depthLabel,
        depthMeters,
        depthProgress: Number(progress.toFixed(4)),
        portalFile: Number(phases.progress.toFixed(4)),
        portalFind: Number(portalFind.toFixed(4)),
        portalWire: Number(phases.wire.toFixed(4)),
        portalFinish: Number(phases.finish.toFixed(4)),
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

    const syncHash = () => {
      if (window.location.hash) alignHash();
      update();
    };
    update();
    const raf = window.requestAnimationFrame(syncHash);
    const later = window.setTimeout(syncHash, 120);
    const afterImages = window.setTimeout(syncHash, 480);
    void document.fonts?.ready.then(syncHash);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("pageshow", syncHash);
    window.addEventListener("popstate", syncHash);
    window.addEventListener("load", syncHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(later);
      window.clearTimeout(afterImages);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("pageshow", syncHash);
      window.removeEventListener("popstate", syncHash);
      window.removeEventListener("load", syncHash);
    };
  }, []);

  return <pre hidden data-octo-motion-proof="" />;
}
