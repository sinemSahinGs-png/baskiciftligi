import { describe, expect, it } from "vitest";

import { splitMotionLines, splitMotionWords, processStepFromProgress } from "@/lib/motion";

describe("motion copy splitters", () => {
  it("keeps Turkish punctuation attached to words", () => {
    expect(splitMotionWords("Mağaza, kütüphane veya kendi dosyan.")).toEqual([
      "Mağaza,",
      " ",
      "kütüphane",
      " ",
      "veya",
      " ",
      "kendi",
      " ",
      "dosyan.",
    ]);
  });

  it("splits sentences on terminal punctuation", () => {
    expect(
      splitMotionLines(
        "Hazır üründe anlık fiyat. Yüklemede değerlendirme sonrası netleşir.",
      ),
    ).toEqual([
      "Hazır üründe anlık fiyat.",
      "Yüklemede değerlendirme sonrası netleşir.",
    ]);
  });
});

describe("process step thresholds", () => {
  it("maps scroll progress to five stable steps", () => {
    expect(processStepFromProgress(0)).toBe(0);
    expect(processStepFromProgress(0.19)).toBe(0);
    expect(processStepFromProgress(0.2)).toBe(1);
    expect(processStepFromProgress(0.5)).toBe(2);
    expect(processStepFromProgress(0.8)).toBe(4);
    expect(processStepFromProgress(1)).toBe(4);
  });
});
