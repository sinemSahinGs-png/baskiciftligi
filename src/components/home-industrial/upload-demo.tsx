"use client";

import type { Route } from "next";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { WordReveal } from "@/components/motion/premium";
import { HomeTrackLink } from "@/components/home/home-track-link";

const STEPS = [
  { n: "01", title: "Dosyayı bırak", body: "STL veya 3MF yükle." },
  { n: "02", title: "Üretimi seç", body: "Malzeme, renk ve kalite." },
  { n: "03", title: "Fiyatı gör", body: "KDV dahil üretim bedeli." },
] as const;

function saveDataSubscribe() {
  return () => undefined;
}

function getSaveData() {
  return Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
  );
}

function emptySubscribe() {
  return () => undefined;
}

export function UploadDemo() {
  const reduceMotion = useReducedMotion() === true;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(true);
  const dataSaver = useSyncExternalStore(saveDataSubscribe, getSaveData, () => false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !reduceMotion && !dataSaver) void node.play().catch(() => undefined);
        else node.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [dataSaver, reduceMotion]);

  return (
    <section
      id="modelini-yukle"
      data-home-theme="mono"
      className="hi-section hi-upload-demo"
      aria-labelledby="upload-demo-heading"
    >
      <div className="hi-shell hi-upload-demo-grid">
        <div>
          <WordReveal as="h2" id="upload-demo-heading" className="hi-title" text="MODELİNİ YÜKLE." />
          <p className="hi-upload-demo-sub">FİYATINI ANINDA GÖR.</p>
          <ol className="hi-upload-demo-steps">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className="hi-mono">{step.n}</span>
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </li>
            ))}
          </ol>
          <HomeTrackLink
            event="upload_cta_clicked"
            href={"/model-yukle" as Route}
            className="hi-btn mt-6 inline-flex min-h-11"
          >
            Model yüklemeye geç
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </HomeTrackLink>
        </div>
        <figure className="hi-upload-demo-media">
          {mounted && hasVideo && !reduceMotion && !dataSaver ? (
            <video
              ref={videoRef}
              className="hi-upload-demo-video"
              muted
              loop
              playsInline
              preload="none"
              poster="/images/upload-flow/upload-demo-poster.webp"
              onError={() => setHasVideo(false)}
            >
              <source src="/videos/upload-flow/upload-demo-mobile.mp4" media="(max-width: 767px)" type="video/mp4" />
              <source src="/videos/upload-flow/upload-demo-desktop.mp4" type="video/mp4" />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/images/upload-flow/upload-demo-poster.webp"
              alt="Dosya yükleme ve anında fiyat adımları"
              className="hi-upload-demo-poster"
            />
          )}
          <figcaption className="hi-upload-demo-caption">
            Gerçek arayüz: dosya, seçenekler, hesaplanan fiyat.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
