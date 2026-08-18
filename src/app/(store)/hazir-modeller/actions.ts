"use server";

import { requestExternalPermissionReview } from "@/domain/external-models/permission-store";

export async function requestThingiverseReview(input: {
  externalId: string;
  title: string;
  creator: string;
  license: string;
  originalUrl: string;
}) {
  if (!/^\d+$/.test(input.externalId)) {
    return { ok: false as const };
  }

  requestExternalPermissionReview({
    source: "thingiverse",
    externalId: input.externalId,
    title: input.title,
    creator: input.creator,
    license: input.license,
    originalUrl: input.originalUrl,
  });

  return { ok: true as const };
}
