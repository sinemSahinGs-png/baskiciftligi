/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("motion/react", () => ({
  useReducedMotion: () => false,
}));

import { useAnimatedPlaceholder } from "@/hooks/use-animated-placeholder";

describe("useAnimatedPlaceholder", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not animate when input has value", () => {
    const { result } = renderHook(() =>
      useAnimatedPlaceholder({
        isFocused: false,
        hasValue: true,
      }),
    );
    expect(result.current.animatedText).toBe("");
  });

  it("does not animate when focused", () => {
    const { result } = renderHook(() =>
      useAnimatedPlaceholder({
        isFocused: true,
        hasValue: false,
      }),
    );
    expect(result.current.animatedText).toBe("");
  });

  it("types characters when empty and blurred", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAnimatedPlaceholder({
        isFocused: false,
        hasValue: false,
        phrases: ["ab"],
      }),
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.animatedText.length).toBeGreaterThan(0);
    expect(result.current.animatedText.length).toBeLessThanOrEqual(2);
  });
});
