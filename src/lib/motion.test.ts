import { describe, expect, it } from "vitest";

import { splitMotionLines, splitMotionWords } from "@/lib/motion";

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
