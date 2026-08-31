import { describe, expect, it } from "vitest";

import {
  mapAnalysisError,
  mapWorkerBusyError,
  mapWorkerServiceUnavailableError,
  sanitizeCustomerErrorMessage,
} from "@/domain/manufacturing/worker-errors";

describe("worker-errors", () => {
  it("sanitizes internal infrastructure terms from customer copy", () => {
    expect(
      sanitizeCustomerErrorMessage(
        "Dilimleme işçisi çevrimdışı. Docker Compose ile başlatın.",
      ),
    ).toBe("Analiz tamamlanamadı.");
  });

  it("maps worker unavailable to customer-safe service message", () => {
    const mapped = mapWorkerServiceUnavailableError();
    expect(mapped.message).toContain("kısa süre sonra tekrar dene");
    expect(mapped.message).not.toMatch(/docker/i);
  });

  it("maps persisted worker_offline job errors without docker copy", () => {
    const mapped = mapAnalysisError({
      errorCode: "worker_offline",
      state: "uploaded",
    });
    expect(mapped.title).toContain("tamamlanamıyor");
    expect(mapped.message).not.toMatch(/docker/i);
  });

  it("maps worker busy separately from offline", () => {
    const busy = mapWorkerBusyError();
    expect(busy.title).toContain("sırası");
    expect(busy.canManualReview).toBe(false);
  });
});
