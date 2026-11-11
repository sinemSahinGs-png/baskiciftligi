import { notFound } from "next/navigation";

import { PaytrStubClient } from "@/components/wholesale/checkout/paytr-stub-client";
import { isWholesalePaytrStubEnabled } from "@/lib/wholesale/credentials";

export const dynamic = "force-dynamic";

export default function PaytrStubPage() {
  if (!isWholesalePaytrStubEnabled()) {
    notFound();
  }
  return <PaytrStubClient />;
}
