"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useReducedMotion } from "motion/react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { MagneticAction, WordReveal } from "@/components/motion/premium";
import { setPendingOwnedUpload } from "@/lib/home/pending-owned-upload";
import { trackHomeEvent } from "@/lib/home/analytics";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const STEP_IDS = ["01", "02", "03"] as const;

const ALLOWED = [".stl", ".3mf"];
const MAX_BYTES = 100 * 1024 * 1024;

function isAllowed(file: File) {
  const name = file.name.toLowerCase();
  return ALLOWED.some((ext) => name.endsWith(ext));
}

export function AutoQuote() {
  const t = useTranslations();
  const STEPS = [
    { id: STEP_IDS[0], title: t("home.quoteStep1") },
    { id: STEP_IDS[1], title: t("home.quoteStep2") },
    { id: STEP_IDS[2], title: t("home.quoteStep3") },
  ];
  const router = useRouter();
  const reduce = useReducedMotion() === true;
  const sectionRef = useRef<HTMLElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.28 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function takeFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!isAllowed(file)) {
      setError(t("home.quoteStlOnly"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("home.quoteTooBig"));
      return;
    }
    setError(null);
    setFileName(file.name);
    setPendingOwnedUpload(file);
    trackHomeEvent({ name: "upload_cta_clicked" });
    router.push("/model-yukle" as Route);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    takeFile(event.dataTransfer.files);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    takeFile(event.target.files);
  }

  return (
    <section
      ref={sectionRef}
      id="sana-gore-hazir-modeller"
      data-home-theme="mono"
      data-quote-live={fileName ? "true" : "false"}
      className="hi-section hi-quote-lab"
      aria-labelledby="archive-heading"
    >
      <span id="modelin-hazir-mi" className="sr-only">
        {t("home.uploadModel")}
      </span>
      <div className="hi-shell">
        <p className="hi-kicker">{t("home.quoteKicker")}</p>
        <h2 id="archive-heading" className="hi-title">
          <WordReveal as="span" className="hi-quote-title-line" text={t("home.quoteTitle1")} />
          <WordReveal as="span" className="hi-quote-title-line" text={t("home.quoteTitle2")} />
        </h2>
        <ol className="hi-quote-stages">
          {STEPS.map((step) => (
            <li key={step.id}>
              <div className="hi-quote-stage-head">
                <p className="hi-quote-num">{step.id}</p>
                <h3 className="hi-quote-stage-title">{step.title}</h3>
              </div>
            </li>
          ))}
        </ol>

        <div className="hi-quote-lab-grid mt-5">
          <label
            htmlFor="home-auto-quote-file"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            data-dragging={dragging ? "true" : "false"}
            data-industrial-asset="path-upload-object"
            className="hi-quote-drop"
          >
            <input
              id="home-auto-quote-file"
              type="file"
              accept=".stl,.3mf,model/stl"
              className="sr-only"
              onChange={onChange}
            />
            <span className="hi-quote-drop-kicker">STL · 3MF</span>
            <span className="hi-quote-drop-title">{t("home.quoteDropTitle")}</span>
            <span className="hi-quote-drop-note">
              {t("home.quoteDropNote")}
            </span>
            {error ? (
              <span role="alert" className="hi-quote-drop-error">
                {error}
              </span>
            ) : null}
          </label>

          <div
            className={cn("hi-quote-preview", inView && !reduce && "hi-quote-preview-live")}
            data-industrial-asset="archive-main"
          >
            <span className="hi-quote-sample">{t("home.quoteSample")}</span>
            <SlotImage
              src={industrialAssets.archiveMain}
              alt=""
              fill
              sizes="(max-width: 768px) 92vw, 32vw"
              className="object-contain object-center"
            />
            <span className="hi-quote-preview-wire" aria-hidden="true" />
            <span className="hi-quote-scan" aria-hidden="true" />
            <span className="hi-quote-dim hi-quote-dim-x" aria-hidden="true">
              X
            </span>
            <span className="hi-quote-dim hi-quote-dim-y" aria-hidden="true">
              Y
            </span>
            <span className="sr-only" data-industrial-asset="archive-thumb-01" />
            <span className="sr-only" data-industrial-asset="archive-thumb-02" />
          </div>
        </div>
        <a href={"/ozel-siparis" as Route} className="hi-quote-support">
          <span className="hi-quote-drop-kicker">{t("home.quoteSupportKicker")}</span>
          <span className="hi-quote-drop-title">{t("home.quoteSupportTitle")}</span>
          <span className="hi-quote-drop-note">
            {t("home.quoteSupportNote")}
          </span>
        </a>

        <p className="hi-lede hi-quote-console-note">
          {t("home.quoteNote")}
        </p>
        <MagneticAction className="hi-quote-console-cta">
          <HomeTrackLink
            event="upload_cta_clicked"
            href={"/model-yukle" as Route}
            data-quote-cta=""
            className="hi-btn"
          >
            {t("home.quoteCta")}
          </HomeTrackLink>
        </MagneticAction>
      </div>
    </section>
  );
}
