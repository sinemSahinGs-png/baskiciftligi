import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { OpsQuestBoard } from "@/components/admin/ops-quest-board";
import { getOpsBoard } from "@/domain/admin/ops-board";
import { isLilDiscOnlyStaff } from "@/lib/catalog/authorization";
import { requireAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Görevler",
};

export default async function AdminQuestsPage() {
  const viewer = await requireAdmin();
  if (isLilDiscOnlyStaff(viewer.role)) {
    redirect("/admin/lil-disc");
  }
  const board = await getOpsBoard();

  return (
    <>
      <AdminPageHeader
        eyebrow="Komuta"
        title="Görevler"
        description="Siteyi satışa hazırlama ve ardından büyütme. Tamamlananlar XP kazanır; eksikler burada durur."
      />
      <OpsQuestBoard
        quests={board.quests}
        xp={board.xp}
        maxXp={board.maxXp}
      />
    </>
  );
}
