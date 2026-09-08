/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HERO_IDEA_EXAMPLES, HERO_TYPEWRITER } from "@/components/home-industrial/hero-media";
import { useHeroTypewriter } from "@/hooks/use-hero-typewriter";

const first = HERO_IDEA_EXAMPLES[0];
const rng = () => 0;

describe("useHeroTypewriter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with the first example after the initial delay", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useHeroTypewriter({ enabled: true, reducedMotion: false, rng }),
    );

    expect(result.current.text).toBe("");

    act(() => {
      vi.advanceTimersByTime(HERO_TYPEWRITER.initialDelay);
    });
    expect(result.current.text).toBe(first.slice(0, 1));
    expect(result.current.text.startsWith("B")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(first.length * HERO_TYPEWRITER.typeMin);
    });
    expect(result.current.text).toBe(first);
  });

  it("deletes the first phrase and types the next example", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useHeroTypewriter({ enabled: true, reducedMotion: false, rng }),
    );

    act(() => {
      vi.advanceTimersByTime(
        HERO_TYPEWRITER.initialDelay + first.length * HERO_TYPEWRITER.typeMin,
      );
    });
    expect(result.current.text).toBe(first);

    act(() => {
      vi.advanceTimersByTime(HERO_TYPEWRITER.pauseCompleteMin + 8 * HERO_TYPEWRITER.deleteMin);
    });
    expect(result.current.text.length).toBeGreaterThan(0);
    expect(result.current.text.length).toBeLessThan(first.length);
    expect(first.startsWith(result.current.text)).toBe(true);

    const remaining = result.current.text.length;
    act(() => {
      vi.advanceTimersByTime(
        remaining * HERO_TYPEWRITER.deleteMin + HERO_TYPEWRITER.pauseEmptyMin,
      );
    });
    act(() => {
      vi.advanceTimersByTime(HERO_IDEA_EXAMPLES[1].length * HERO_TYPEWRITER.typeMin);
    });
    expect(result.current.text).toBe(HERO_IDEA_EXAMPLES[1]);
  });

  it("stops immediately when disabled by focus or typing", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ enabled }) => useHeroTypewriter({ enabled, reducedMotion: false, rng }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      vi.advanceTimersByTime(HERO_TYPEWRITER.initialDelay + 12 * HERO_TYPEWRITER.typeMax);
    });
    expect(result.current.text.length).toBeGreaterThan(0);

    rerender({ enabled: false });
    expect(result.current.text).toBe("");
    expect(result.current.showOverlay).toBe(false);
  });

  it("can restart from the first phrase after an empty unfocused delay", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useHeroTypewriter({
        enabled: true,
        reducedMotion: false,
        rng,
        delayMs: HERO_TYPEWRITER.restartDelay,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(HERO_TYPEWRITER.restartDelay - 50);
    });
    expect(result.current.text).toBe("");

    act(() => {
      vi.advanceTimersByTime(50 + first.length * HERO_TYPEWRITER.typeMin);
    });
    expect(result.current.text).toBe(first);
  });

  it("shows a static first phrase when reduced motion is enabled", () => {
    const { result } = renderHook(() =>
      useHeroTypewriter({ enabled: true, reducedMotion: true, rng }),
    );
    expect(result.current.text).toBe(first);
    expect(result.current.complete).toBe(true);
  });
});
