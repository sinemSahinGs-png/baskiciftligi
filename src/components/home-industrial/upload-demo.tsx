"use client";

import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";

import { WordReveal } from "@/components/motion/premium";
import { HomeTrackLink } from "@/components/home/home-track-link";

const STEPS = [
  { n: "01", title: "Dosyayı bırak", body: "STL veya 3MF yükle." },
  { n: "02", title: "Üretimi seç", body: "Malzeme, renk ve kalite." },
  { n: "03", title: "Fiyatı gör", body: "KDV dahil üretim bedeli." },
] as const;

/**
 * Real silent MP4s are not in the repo yet. Do not request missing files
 * (that produces 404 loops). Keep these paths for a later recording pass:
 * /videos/upload-flow/upload-demo-desktop.mp4
 * /videos/upload-flow/upload-demo-mobile.mp4
 */
const UPLOAD_DEMO_VIDEO_READY = false;

export function UploadDemo() {
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
          <p className="hi-upload-demo-note">
            Gerçek üretim fiyatı, dosyayı yükledikten ve seçenekleri onayladıktan sonra hesaplanır.
          </p>
        </div>
        <figure className="hi-upload-demo-media">
          {UPLOAD_DEMO_VIDEO_READY ? (
            <video
              className="hi-upload-demo-video"
              muted
              loop
              playsInline
              preload="none"
              poster="/images/upload-flow/upload-demo-poster.webp"
            >
              <source src="/videos/upload-flow/upload-demo-mobile.mp4" media="(max-width: 767px)" type="video/mp4" />
              <source src="/videos/upload-flow/upload-demo-desktop.mp4" type="video/mp4" />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/images/upload-flow/upload-demo-poster.webp"
              alt="Örnek akış: yüklenmiş model, malzeme seçimi ve hesaplanmış fiyat özeti"
              className="hi-upload-demo-poster"
            />
          )}
          <p className="hi-upload-demo-badge">ÖRNEK AKIŞ</p>
          <figcaption className="hi-upload-demo-caption">
            Yükleme arayüzü: model plakada, seçenekler açık, örnek fiyat görünür.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
