"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { GoogleReviews } from "@/components/home-industrial/google-reviews";
import { mineralCutouts } from "@/components/home-industrial/industrial-slots";
import { ScrollWords } from "@/components/home-industrial/scroll-words";
import { SlotImage } from "@/components/home-industrial/slot-image";

const LOOP_MS = 20000;
const COLORS = ["Siyah", "Beyaz", "Gri", "Turuncu"] as const;

export function ProductionStory() {
  const t = useTranslations();
  const reduce = useReducedMotion() === true;
  const rootRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(reduce ? 2 : 0);
  const shownStep = reduce ? 2 : step;

  useEffect(() => {
    if (reduce) {
      setStep(2);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const phase = ((now - started) % LOOP_MS) / LOOP_MS;
      setStep(phase < 0.34 ? 0 : phase < 0.66 ? 1 : 2);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      id="uc-uretim-yolu"
      data-home-theme="umber"
      data-octo-zone="atelier"
      data-octo-story-step={String(shownStep)}
      data-order-film={reduce ? "static" : "play"}
      className="octo-band octo-story octo-order-film is-revealed"
      aria-labelledby="story-heading"
    >
      <div className="hi-shell octo-band-shell">
        <ScrollWords
          as="h2"
          id="story-heading"
          className="octo-band-title octo-band-title-light"
          text={t("home.storyTitle")}
        />
        <ScrollWords as="p" className="octo-order-film-lede" text={t("home.storyFilmLede")} />

        <div className="octo-story-mobile-visual octo-order-frame">
          <div className="octo-story-visual octo-order-stage" aria-hidden="true">
            <div className="octo-film-monitor">
              <SlotImage
                src={mineralCutouts.filmMonitor}
                alt=""
                fill
                className="object-contain"
                sizes="(max-width: 767px) 96vw, 1100px"
                priority
              />
              <div className="octo-film-glass octo-film-screen">
                <div className="octo-film-fit">
                <div className="octo-film-chrome">
                  <span className="octo-film-traffic" />
                  <span className="octo-film-nav">‹</span>
                  <span className="octo-film-nav">›</span>
                  <div className="octo-film-omnibox">
                    <span className="octo-film-lock">🔒</span>
                    <p className="octo-film-url octo-film-url-home">https://octostudio.com.tr</p>
                    <p className="octo-film-url octo-film-url-app">
                      https://octostudio.com.tr/model-yukle
                    </p>
                  </div>
                </div>

                <div className="octo-film-home">
                  <span className="octo-film-home-cta">{t("home.startFileCta")}</span>
                </div>

                <div className="octo-film-studio">
                  <div className="octo-film-appbar">
                    <p>
                      <span className="octo-film-filename">kuzgun.stl</span>
                      <span className="octo-film-meta"> · 84.2 × 61.0 × 96.4 mm</span>
                    </p>
                    <div className="octo-film-appbar-actions">
                      <span className="octo-film-calc">{t("studio.calculate")}</span>
                    </div>
                  </div>
                  <div className="octo-film-body">
                    <div className="octo-film-viewer">
                      <p className="octo-film-drop">STL / 3MF / OBJ yükle</p>
                      <span className="octo-film-plate" />
                      <div className="octo-film-model">
                        <SlotImage
                          src={mineralCutouts.filmStlPreview}
                          alt=""
                          fill
                          className="object-contain object-bottom"
                          sizes="(max-width: 767px) 92vw, 720px"
                        />
                      </div>
                    </div>
                    <aside className="octo-film-side">
                      <p className="octo-film-side-title">{t("studio.title")}</p>
                      <p className="octo-film-fileline">kuzgun.stl · 128k üçgen</p>
                      <div className="octo-film-swatches">
                        {COLORS.map((label, index) => (
                          <span key={label} data-on={index === 0 ? "true" : "false"}>
                            {label}
                          </span>
                        ))}
                      </div>
                      <p className="octo-film-pricebox">
                        {t("studio.priceReady")}
                        <strong>₺150,00</strong>
                      </p>
                      <span className="octo-film-cart">{t("studio.addCart")}</span>
                      <span className="octo-film-buy">{t("home.storyFilmOrder")}</span>
                    </aside>
                  </div>
                </div>

                <div className="octo-film-explorer">
                  <div className="octo-film-explorer-bar">
                    <span>Dosya Gezgini</span>
                    <i />
                  </div>
                  <p className="octo-film-explorer-path">Bu PC › Belgeler › Modeller</p>
                  <ul>
                    <li data-grab="true">
                      <b />
                      kuzgun.stl
                    </li>
                    <li>
                      <b />
                      vazo.stl
                    </li>
                    <li>
                      <b />
                      anahtarlik.3mf
                    </li>
                  </ul>
                </div>
                <span className="octo-film-ghost">
                  <b />
                  kuzgun.stl
                </span>

                <p className="octo-film-toast">{t("home.storyFilmDone")}</p>
                <span className="octo-order-cursor" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link
          href={"/model-yukle" as Route}
          className="octo-start-cta octo-order-film-cta"
          data-story-step=""
          data-story-end=""
        >
          {t("home.startFileCta")}
        </Link>
        <GoogleReviews />
      </div>
    </section>
  );
}
