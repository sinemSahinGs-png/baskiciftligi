"use client";

import { RecoveryErrorState } from "@/components/auth/recovery-error-state";

export default function ResetPasswordSegmentError() {
  return <RecoveryErrorState reason="malformed" />;
}
