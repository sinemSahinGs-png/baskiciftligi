"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { trackHomeEvent } from "@/lib/home/analytics";

export function CompactUpload() {
  const t = useTranslations();
  return (
    <section
      id="sana-gore-hazir-modeller"
      data-home-theme="sand"
      className="octo-story octo-upload"
      aria-labelledby="upload-invite-heading"
    >
      <div className="hi-shell octo-upload-row">
        <div>
          <h2 id="upload-invite-heading" className="octo-serif octo-serif-on-dark">
            {t("home.uploadInviteTitle")}
          </h2>
          <p>{t("home.uploadInviteLede")}</p>
          <Link
            href={"/model-yukle" as Route}
            className="octo-cta"
            onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
          >
            {t("home.heroSecondary")}
          </Link>
        </div>
        <div className="octo-upload-visual">
          <SlotImage
            src={industrialAssets.pathUploadObject}
            alt=""
            fill
            sizes="120px"
          />
        </div>
      </div>
    </section>
  );
}
