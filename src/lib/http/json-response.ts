import { NextResponse } from "next/server";

import {
  newRequestId,
  statusToCode,
  type PublicErrorCode,
} from "@/lib/http/public-api-error";
import { logger } from "@/lib/observability/logger";

export function jsonOk<T extends Record<string, unknown>>(
  body: T,
  init?: { status?: number; requestId?: string },
) {
  const requestId = init?.requestId ?? newRequestId();
  return NextResponse.json(
    { ok: true, requestId, ...body },
    {
      status: init?.status ?? 200,
      headers: { "x-request-id": requestId },
    },
  );
}

export function jsonError(input: {
  status: number;
  message: string;
  code?: PublicErrorCode;
  requestId?: string;
  log?: string;
}) {
  const requestId = input.requestId ?? newRequestId();
  const code = input.code ?? statusToCode(input.status);
  if (input.log) {
    logger.warn(input.log, { requestId, code, status: input.status });
  }
  return NextResponse.json(
    {
      ok: false,
      code,
      message: input.message,
      requestId,
      error: input.message,
    },
    {
      status: input.status,
      headers: { "x-request-id": requestId },
    },
  );
}
