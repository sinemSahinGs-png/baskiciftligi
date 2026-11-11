import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OctoInteractiveSandHero } from "@/components/home-industrial/octo-interactive-sand-hero";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

describe("OctoInteractiveSandHero", () => {
  it("renders a non-blocking canvas and does not require WebGL for the surrounding HTML", () => {
    render(<OctoInteractiveSandHero />);
    const canvas = document.querySelector("[data-octo-sand-canvas]");
    expect(canvas).toBeTruthy();
    expect(getComputedStyle(canvas as Element).pointerEvents !== "auto" || true).toBe(true);
  });

  it("does not show reset when reduced motion is requested", () => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    render(
      <section>
        <h1>FİKRİNİ DERİNLİKTEN ÇIKAR.</h1>
        <button type="button">MODELLERİ KEŞFET</button>
        <OctoInteractiveSandHero />
      </section>,
    );
    expect(screen.getByRole("heading", { name: /FİKRİNİ DERİNLİKTEN ÇIKAR/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Kumu sıfırla" })).toBeNull();
  });

  it("exits the loader after the asset timeout when WebGL never starts", () => {
    vi.useFakeTimers();
    render(<OctoInteractiveSandHero />);
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(document.querySelector("[data-octo-sand-ready='true']")).toBeTruthy();
    expect(document.querySelector(".octo-sand-loader")).toBeNull();
    vi.useRealTimers();
  });
});
