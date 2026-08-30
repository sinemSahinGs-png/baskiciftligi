import { describe, expect, it } from "vitest";

import {
  mapQuoteJobStateToFilePricingFlow,
  resolveFilePricingFlowDisplay,
} from "@/domain/external-models/file-pricing-flow";

describe("file-pricing-flow", () => {
  it("requires file before showing exact price", () => {
    const display = resolveFilePricingFlowDisplay({ state: "file_required" });
    expect(display.mainTextTr).toMatch(/dosya/i);
    expect(display.exactGrossMinor).toBeUndefined();
  });

  it("shows exact price only with analysed metrics", () => {
    const display = resolveFilePricingFlowDisplay({
      state: "analysed",
      exactGrossMinor: 139968,
    });
    expect(display.state).toBe("analysed");
    expect(display.exactGrossMinor).toBe(139968);
  });

  it("does not invent price when analysed state lacks metrics", () => {
    const display = resolveFilePricingFlowDisplay({
      state: "analysed",
      exactGrossMinor: null,
    });
    expect(display.state).toBe("analysis_unavailable");
  });

  it("maps worker-off uploaded state to unavailable", () => {
    expect(
      mapQuoteJobStateToFilePricingFlow("uploaded", { workerOnline: false }),
    ).toBe("analysis_unavailable");
  });

  it("maps invalid file validation message", () => {
    const display = resolveFilePricingFlowDisplay({
      state: "invalid_file",
      validationMessage: "STL gerekli",
    });
    expect(display.mainTextTr).toBe("STL gerekli");
  });
});
