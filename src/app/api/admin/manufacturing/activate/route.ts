import { NextResponse } from "next/server";
import { z } from "zod";

import { activatePricingVersion } from "@/domain/manufacturing/pricing-activation";
import { pricingCalibrationBodySchema } from "@/domain/manufacturing/calibration-input";
import { LAUNCH_ACTIVATION_CONFIRM_PHRASE } from "@/domain/manufacturing/launch-calibration";
import { requirePricingCalibrator } from "@/lib/auth/session";

const bodySchema = z.object({
  version: z.int().positive().optional(),
  calibration: pricingCalibrationBodySchema.optional(),
  confirmPhrase: z.literal(LAUNCH_ACTIVATION_CONFIRM_PHRASE),
});

export async function POST(request: Request) {
  let viewer;
  try {
    viewer = await requirePricingCalibrator();
  } catch {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Onay ifadesi "${LAUNCH_ACTIVATION_CONFIRM_PHRASE}" olmalıdır.`,
      },
      { status: 422 },
    );
  }

  try {
    const result = await activatePricingVersion({
      version: parsed.data.version,
      calibration: parsed.data.calibration,
      activatedBy: viewer.id,
      confirmPhrase: parsed.data.confirmPhrase,
    });

    return NextResponse.json({
      ok: true,
      version: result.config.version,
      formulaId: result.config.formulaId,
      checksum: result.config.checksum,
      activatedAt: result.config.activatedAt,
      backupFile: result.backupFile,
      cubeGrossMinor: result.gate.cubeGrossMinor,
      scenarios: result.gate.scenarios,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Etkinleştirme başarısız.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
