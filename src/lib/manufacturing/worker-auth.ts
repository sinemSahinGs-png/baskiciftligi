import { NextResponse } from "next/server";

import { slicerWorkerSecret } from "@/lib/manufacturing/paths";
import { bearerToken, workerSecretMatches } from "@/lib/manufacturing/worker-secret";

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
    return NextResponse.json({ error: "Yetkisiz işçi." }, { status: 401 });
  }
  return null;
}
