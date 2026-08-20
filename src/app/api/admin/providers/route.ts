import { NextResponse } from "next/server";

import { getViewer } from "@/lib/auth/session";
import { canViewAdminCatalog } from "@/lib/catalog/authorization";
import { listProviderStatusSnapshots } from "@/providers/registry";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer || !canViewAdminCatalog(viewer.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  return NextResponse.json({
    providers: listProviderStatusSnapshots(),
  });
}
