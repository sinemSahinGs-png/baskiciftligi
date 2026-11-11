"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import "./octo-sand-hero.css";

import { OctoMark } from "@/components/brand/octo-mark";
import { acquireWebGl2, OctoSandEngine, type SandDiagnostics } from "@/lib/hero-sand/engine";
import {
  SAND_LOAD_TIMEOUT_MS,
  allowHeroDebug,
  chooseSandDpr,
  chooseSandGrid,
  chooseSandInitReason,
  isHeroChrome,
  sandImpulseFromPointer,
  type SandDebugReason,
} from "@/lib/hero-sand/physics";
import { OCTO_SAND_FIELD, readTvScreenFromStyles } from "@/lib/hero-sand/tv-screen";

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

function sizeHost(canvas: HTMLCanvasElement, host: HTMLElement) {
  const box = host.getBoundingClientRect();
  const width = Math.max(host.clientWidth, box.width, 1);
  const height = Math.max(host.clientHeight, box.height, 1);
  const dpr = chooseSandDpr(window.devicePixelRatio, width);
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  return { width, height, dpr };
}

function readScreenAgainstHost(host: HTMLElement) {
  const screen = host.closest(".octo-tv-stage")?.querySelector<HTMLElement>("[data-octo-tv-screen]");
  const hostBox = host.getBoundingClientRect();
  const screenBox = screen?.getBoundingClientRect();
  if (!screenBox || hostBox.width < 1 || hostBox.height < 1) {
    const hero = host.closest(".octo-tv-hero") ?? host;
    return readTvScreenFromStyles(getComputedStyle(hero));
  }
  const padX = screenBox.width * 0.2;
  const padY = screenBox.height * 0.14;
  return {
    left: (screenBox.left - padX - hostBox.left) / hostBox.width,
    top: (screenBox.top - padY - hostBox.top) / hostBox.height,
    width: (screenBox.width + padX * 2) / hostBox.width,
    height: (screenBox.height + padY * 2) / hostBox.height,
    radius: 0.08,
  };
}

export function OctoInteractiveSandHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OctoSandEngine | null>(null);
  const lastPointer = useRef({ x: 0, y: 0, armed: false });
  const [mode, setMode] = useState<FallbackMode>("poster");
  const [reason, setReason] = useState<SandDebugReason | "pending">("pending");
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
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
    let unbindAlbedo: (() => void) | undefined;
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled && !settled && !engineRef.current) {
        settled = true;
        setReason("init_timeout");
        setMode("static-sand");
        setLive(false);
        setReady(true);
        setStatus("Statik yüzey");
      }
    }, SAND_LOAD_TIMEOUT_MS);

    const fallback = (nextReason: SandDebugReason, nextMode: FallbackMode = "static-sand") => {
      if (cancelled) return;
      settled = true;
      window.clearTimeout(timeout);
      setReason(nextReason);
      setMode(nextMode);
      setLive(false);
      setReady(true);
      setStatus("Statik yüzey");
    };

    const start = () => {
      if (cancelled) return;
      const skip = chooseSandInitReason({
        reducedMotion,
        saveData,
        webgl2: true,
      });
      if (skip) {
        fallback(skip);
        return;
      }
      const sized = sizeHost(canvas, host);
      let gl: WebGL2RenderingContext | null = null;
      try {
        gl = acquireWebGl2(canvas);
      } catch {
        gl = null;
      }
      if (!gl) {
        fallback("webgl2_unavailable");
        return;
      }
      const grid = chooseSandGrid({
        width: sized.width,
        reducedMotion,
        saveData,
        webgl2: true,
      });
      if (!grid) {
        fallback(reducedMotion ? "reduced_motion" : saveData ? "data_saver" : "webgl2_unavailable");
        return;
      }
      try {
        const next = new OctoSandEngine(canvas, grid, sized.dpr);
        next.resize(sized.width, sized.height, sized.dpr);
        next.setScreen(readScreenAgainstHost(host));
        const field = new Image();
        field.decoding = "async";
        const bindField = () => {
          if (cancelled || field.naturalWidth < 1) return;
          next.setAlbedo(field);
        };
        field.addEventListener("load", bindField);
        field.addEventListener("error", () => {
          fallback("texture_load_failed");
          next.destroy();
          engineRef.current = null;
        });
        const shell = host.closest(".octo-tv-frame")?.querySelector<HTMLImageElement>("img.octo-tv-shell");
        const bindShell = () => {
          if (cancelled || !shell || shell.naturalWidth < 1) return;
          next.setPhoto(shell);
        };
        shell?.addEventListener("load", bindShell);
        unbindAlbedo = () => {
          field.removeEventListener("load", bindField);
          shell?.removeEventListener("load", bindShell);
        };
        field.src = OCTO_SAND_FIELD;
        if (field.complete) bindField();
        if (shell?.complete) bindShell();
        engineRef.current = next;
        settled = true;
        window.clearTimeout(timeout);
        setMode("interactive");
        setReason("webgl");
        setReady(true);
        setStatus("Hazır");
      } catch {
        fallback("engine_init_failed");
      }
    };

    const frame = requestAnimationFrame(start);

    const onResize = () => {
      if (!engineRef.current || !host) return;
      const sized = sizeHost(canvas, host);
      engineRef.current.resize(sized.width, sized.height, sized.dpr);
      engineRef.current.setScreen(readScreenAgainstHost(host));
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
    const onLost = () => {
      fallback("context_lost");
    };
    canvas.addEventListener("webglcontextlost", onLost);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      unbindAlbedo?.();
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [reducedMotion, saveData]);

  useEffect(() => {
    if (mode !== "interactive") return;
    const timer = window.setInterval(() => {
      const snapshot = engineRef.current?.diagnostics();
      if (!snapshot) return;
      if (snapshot.contextLost) {
        setReason("context_lost");
        setLive(false);
        setMode("static-sand");
        return;
      }
      setLive(snapshot.live);
    }, 80);
    return () => window.clearInterval(timer);
  }, [mode]);

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
      if (!lastPointer.current.armed) {
        lastPointer.current = { x: event.clientX, y: event.clientY, armed: true };
        return;
      }
      lastPointer.current = { x: event.clientX, y: event.clientY, armed: true };
      const impulse = sandImpulseFromPointer({
        dx,
        dy,
        isTouch: event.pointerType === "touch",
      });
      if (!impulse.force) return;
      engineRef.current?.impulse(
        (event.clientX - rect.left) / Math.max(rect.width, 1),
        (event.clientY - rect.top) / Math.max(rect.height, 1),
        impulse.nx,
        impulse.ny,
        impulse.force,
      );
    };
    const onDown = (event: PointerEvent) => {
      lastPointer.current = { x: event.clientX, y: event.clientY, armed: true };
      if (mode !== "interactive" || reducedMotion) return;
      if (isHeroChrome(event.target)) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      engineRef.current?.impulse(
        (event.clientX - rect.left) / Math.max(rect.width, 1),
        (event.clientY - rect.top) / Math.max(rect.height, 1),
        0.12,
        -0.08,
        0.07,
      );
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
      const canvas = canvasRef.current;
      const css = canvas?.getBoundingClientRect();
      setDebug(
        engineRef.current?.diagnostics() ?? {
          mode: "fallback",
          reason: reason === "pending" ? "init_timeout" : reason,
          grid: 0,
          dpr: 1,
          fps: 0,
          frameMs: 0,
          frames: 0,
          webgl: "none",
          contextLost: reason === "context_lost",
          resetting: false,
          hasAlbedo: false,
          live: false,
          textureWidth: 0,
          textureHeight: 0,
          canvasWidth: canvas?.width ?? 0,
          canvasHeight: canvas?.height ?? 0,
          cssWidth: Math.round(css?.width ?? 0),
          cssHeight: Math.round(css?.height ?? 0),
          sampled: "",
        },
      );
    }, 400);
    return () => window.clearInterval(timer);
  }, [showDebug, reason]);

  return (
    <div
      className="octo-sand-layer"
      data-octo-sand-mode={mode}
      data-octo-sand-ready={ready ? "true" : "false"}
      data-octo-sand-live={live ? "true" : "false"}
      data-octo-sand-reason={reason}
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
              reason,
              ready,
              live,
              reducedMotion,
              saveData,
              sampled: debug?.sampled ?? "",
              textureWidth: debug?.textureWidth ?? 0,
              textureHeight: debug?.textureHeight ?? 0,
              canvasWidth: debug?.canvasWidth ?? 0,
              canvasHeight: debug?.canvasHeight ?? 0,
              cssWidth: debug?.cssWidth ?? 0,
              cssHeight: debug?.cssHeight ?? 0,
              frames: debug?.frames ?? 0,
              fps: debug?.fps ?? 0,
              hasAlbedo: debug?.hasAlbedo ?? false,
              contextLost: debug?.contextLost ?? false,
              webgl: debug?.webgl ?? "none",
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
}
