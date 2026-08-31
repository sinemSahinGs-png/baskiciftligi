import { NextResponse } from "next/server";

import { slicerWorkerSecret } from "@/lib/manufacturing/paths";
import {
  bearerToken,
  diagnoseWorkerAuthMismatch,
  normalizeWorkerSecret,
  secretFingerprint,
  workerSecretMatches,
} from "@/lib/manufacturing/worker-secret";

function logWorkerAuthFailure(input: {
  reason: string;
  tokenLength: number;
  secretLength: number;
  tokenFingerprint: string;
  secretFingerprint: string;
  path: string;
}) {
  console.error(
    "[manufacturing] slicer worker auth rejected",
    JSON.stringify(input),
  );
}

export function assertSlicerWorker(request: Request) {
  const secret = slicerWorkerSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Slicer işçisi kimliği yapılandırılmadı." },
      { status: 503 },
    );
  }
  const token = bearerToken(request.headers.get("authorization"));
  if (!workerSecretMatches(token, secret)) {
    const normalizedToken = normalizeWorkerSecret(token);
    const normalizedSecret = normalizeWorkerSecret(secret);
    const reason = diagnoseWorkerAuthMismatch(token, secret);
    logWorkerAuthFailure({
      reason,
      tokenLength: normalizedToken.length,
      secretLength: normalizedSecret.length,
      tokenFingerprint: secretFingerprint(normalizedToken),
      secretFingerprint: secretFingerprint(normalizedSecret),
      path: new URL(request.url).pathname,
    });
    return NextResponse.json(
      {
        error: "Yetkisiz işçi.",
        authHint: reason,
      },
      { status: 401 },
    );
  }
  return null;
}
