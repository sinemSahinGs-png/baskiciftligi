"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { OPS_QUEST_COOKIE } from "@/domain/admin/ops-board";
import { requireAdmin } from "@/lib/auth/session";

export async function completeOpsQuestAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("questId") ?? "").trim();
  if (!id) return;
  const store = await cookies();
  const current = new Set(
    (store.get(OPS_QUEST_COOKIE)?.value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  current.add(id);
  store.set(OPS_QUEST_COOKIE, [...current].join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/gorevler");
}
