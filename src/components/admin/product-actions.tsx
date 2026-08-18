"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Archive, Copy, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archiveProductAction,
  deleteProductAction,
  duplicateProductAction,
} from "@/app/admin/actions";

interface ProductActionsProps {
  id: string;
  name: string;
  status: "draft" | "active" | "archived";
  afterDelete?: "list" | "refresh";
  showEdit?: boolean;
}

export function ProductActions({
  id,
  name,
  status,
  afterDelete = "refresh",
  showEdit = true,
}: ProductActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateProductAction(id);
      if (result.status === "error" || !result.id) {
        toast.error(result.message ?? "Ürün çoğaltılamadı.");
        return;
      }

      toast.success(result.message);
      router.push(`/admin/urunler/${result.id}`);
    });
  }

  function archive() {
    if (
      !window.confirm(
        `“${name}” ürünü arşivlensin mi? Mağazada görünmeyecektir.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await archiveProductAction(id);
      if (result.status === "error") {
        toast.error(result.message ?? "Ürün arşivlenemedi.");
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function remove() {
    if (
      !window.confirm(
        `“${name}” ürünü ve bağlı varyant/stok kayıtları kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result.status === "error") {
        toast.error(result.message ?? "Ürün silinemedi.");
        return;
      }

      toast.success(result.message);
      if (afterDelete === "list") {
        router.push("/admin/urunler");
      } else {
        router.refresh();
      }
    });
  }

  const buttonClass =
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-white/12 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground disabled:pointer-events-none disabled:opacity-45";

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Ürün işlemleri">
      {showEdit ? (
        <Link href={`/admin/urunler/${id}`} className={buttonClass}>
          <Pencil className="size-3.5" aria-hidden="true" />
          Düzenle
        </Link>
      ) : null}
      <button
        type="button"
        onClick={duplicate}
        disabled={pending}
        className={buttonClass}
      >
        {pending ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
        Çoğalt
      </button>
      {status !== "archived" ? (
        <button
          type="button"
          onClick={archive}
          disabled={pending}
          className={buttonClass}
        >
          <Archive className="size-3.5" aria-hidden="true" />
          Arşivle
        </button>
      ) : null}
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className={`${buttonClass} border-destructive/20 text-destructive hover:border-destructive/40 hover:text-destructive`}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Sil
      </button>
    </div>
  );
}
