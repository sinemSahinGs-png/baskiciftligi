"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import "./octo-sand-hero.css";

import { OctoMark } from "@/components/brand/octo-mark";
import { OctoSandEngine, type SandDiagnostics } from "@/lib/hero-sand/engine";
import {
  SAND_LOAD_TIMEOUT_MS,
  allowHeroDebug,
  chooseSandDpr,
  chooseSandGrid,
  isHeroChrome,
  sandImpulseFromPointer,
} from "@/lib/hero-sand/physics";

type FallbackMode = "interactive" | "static-sand" | "poster" | "obsidian";

function subscribeReduced(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readReducedMotion() {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function saveDataEnabled() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData);
}

export function OctoInteractiveSandHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OctoSandEngine | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const [mode, setMode] = useState<FallbackMode>("poster");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Mineral yüzey hazırlanıyor");
  const [debug, setDebug] = useState<SandDiagnostics | null>(null);
  const showDebug = useSyncExternalStore(
    () => () => undefined,
    () => allowHeroDebug(window.location.hostname, window.location.search),
    () => false,
  );
  const labelId = useId();
  const reducedMotion = useSyncExternalStore(
    subscribeReduced,
    readReducedMotion,
    () => false,
  );
  const saveData = useSyncExternalStore(
    () => () => undefined,
    saveDataEnabled,
    () => false,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = canvas.parentElement;
    if (!host) return;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const timeout = window.setTimeout(() => {
      if (!cancelled && !engineRef.current) {
        setMode((current) => (current === "interactive" ? current : "static-sand"));
        setReady(true);
        setStatus("Statik yüzey");
      }
    }, SAND_LOAD_TIMEOUT_MS);

    const start = () => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const grid = chooseSandGrid({
        width: host.clientWidth || window.innerWidth,
        reducedMotion,
        saveData,
        webgl2: Boolean(gl),
      });
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      if (!grid) {
        setMode(reducedMotion || saveData ? "static-sand" : "poster");
        setReady(true);
        setStatus("Durağan yüzey");
        return;
      }
      try {
        const dpr = chooseSandDpr(window.devicePixelRatio, host.clientWidth);
        const next = new OctoSandEngine(canvas, grid, dpr);
        next.resize(host.clientWidth, host.clientHeight, dpr);
        engineRef.current = next;
        setMode("interactive");
        setReady(true);
        setStatus("Hazır");
      } catch {
        setMode("static-sand");
        setReady(true);
        setStatus("WebGL yok");
      }
    };

    const frame = requestAnimationFrame(start);

    const onResize = () => {
      if (!engineRef.current || !host) return;
      engineRef.current.resize(
        host.clientWidth,
        host.clientHeight,
        chooseSandDpr(window.devicePixelRatio, host.clientWidth),
      );
    };
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          engineRef.current?.setPaused(!entries.some((entry) => entry.isIntersecting));
        },
        { threshold: 0.02 },
      );
      observer.observe(host);
    }
    const onVisibility = () => {
      engineRef.current?.setPaused(document.visibilityState === "hidden");
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [reducedMotion, saveData]);

  useEffect(() => {
    const section = canvasRef.current?.closest("section");
    if (!section) return;
    const onMove = (event: PointerEvent) => {
      if (mode !== "interactive" || reducedMotion) return;
      if (isHeroChrome(event.target)) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = event.clientX - lastPointer.current.x;
      const dy = event.clientY - lastPointer.current.y;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      const impulse = sandImpulseFromPointer({
        dx,
        dy,
        isTouch: event.pointerType === "touch",
      });
      if (!impulse.force) return;
      engineRef.current?.impulse(
        (event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height,
        impulse.nx,
        impulse.ny,
        impulse.force,
      );
    };
    const onDown = (event: PointerEvent) => {
      lastPointer.current = { x: event.clientX, y: event.clientY };
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerdown", onDown);
    };
  }, [mode, reducedMotion]);

  useEffect(() => {
    if (!showDebug) return;
    const timer = window.setInterval(() => {
      setDebug(engineRef.current?.diagnostics() ?? null);
    }, 400);
    return () => window.clearInterval(timer);
  }, [showDebug]);

  return (
    <div
      className="octo-sand-layer"
      data-octo-sand-mode={mode}
      data-octo-sand-ready={ready ? "true" : "false"}
    >
      <div className="octo-sand-static" aria-hidden="true" data-visible={mode !== "interactive" ? "true" : "false"} />
      <canvas
        ref={canvasRef}
        className="octo-sand-canvas"
        aria-hidden="true"
        data-octo-sand-canvas=""
      />
      <div className="octo-sand-grain" aria-hidden="true" />
      <div className="octo-sand-light" aria-hidden="true" />
      {!ready ? (
        <div className="octo-sand-loader" role="status" aria-live="polite" aria-labelledby={labelId}>
          <OctoMark className="size-8" />
          <span id={labelId}>{status}</span>
          <span className="octo-sand-loader-line" />
        </div>
      ) : null}
      {mode === "interactive" && !reducedMotion ? (
        <button
          type="button"
          className="octo-sand-reset"
          data-octo-sand-ui=""
          aria-label="Kumu sıfırla"
          title="Kumu sıfırla"
          onClick={() => engineRef.current?.startReset()}
        >
          <RotateCcw aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      {showDebug ? (
        <pre className="octo-sand-debug" data-octo-sand-ui="">
          {JSON.stringify(
            {
              mode,
              ready,
              reducedMotion,
              ...(debug ?? {}),
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
}
