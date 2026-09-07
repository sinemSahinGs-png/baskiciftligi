"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { SlotImage } from "@/components/home-industrial/slot-image";
import { heroMedia } from "@/components/home-industrial/hero-media";

function saveDataEnabled() {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return Boolean(connection?.saveData);
}

function subscribeSaveData(onStoreChange: () => void) {
  const connection = (
    navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }
  ).connection;
  connection?.addEventListener("change", onStoreChange);
  return () => connection?.removeEventListener("change", onStoreChange);
}

export function HeroVideo({ reducedMotion }: { reducedMotion: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const saveData = useSyncExternalStore(
    subscribeSaveData,
    saveDataEnabled,
    () => false,
  );
  const showVideo = !failed && !reducedMotion && !hidden && inView && !saveData;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.12));
      },
      { threshold: [0, 0.12, 0.4] },
    );
    observer.observe(node);
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (failed) return;
    const video = videoRef.current;
    if (!video) return;
    const fail = () => setFailed(true);
    const sources = [...video.querySelectorAll("source")];
    sources.forEach((source) => source.addEventListener("error", fail));
    video.addEventListener("error", fail);
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      fail();
    } else if (video.readyState === 0) {
      video.load();
    }
    return () => {
      sources.forEach((source) => source.removeEventListener("error", fail));
      video.removeEventListener("error", fail);
    };
  }, [failed]);

  useEffect(() => {
    const active = videoRef.current;
    if (!active) return;
    if (showVideo) {
      void active.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });
      return;
    }
    active.pause();
  }, [showVideo]);

  return (
    <div ref={rootRef} className="hi-hero-media" aria-hidden="true">
      {failed ? (
        <div data-industrial-asset="hero-wireframe-vase" className="hi-hero-still">
          <SlotImage
            src={heroMedia.fallback}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[46%_88%] sm:object-[50%_82%] md:object-[52%_48%] lg:object-[54%_46%] xl:object-[56%_44%]"
          />
        </div>
      ) : (
        <>
          {/* Poster is a small public JPEG; next/image would add a competing optimized request. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroMedia.poster}
            alt=""
            className="hi-hero-poster"
            width={960}
            height={1200}
            decoding="async"
            fetchPriority="high"
          />
          <video
            ref={videoRef}
            className="hi-hero-video"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            data-hero-video="responsive"
            data-ready={ready ? "true" : "false"}
            controls={false}
            disablePictureInPicture
            onCanPlay={() => setReady(true)}
            onPlaying={() => setReady(true)}
            onError={() => setFailed(true)}
          >
            <source
              src={heroMedia.mobileVideo}
              type="video/mp4"
              media="(max-width: 767.98px)"
            />
            <source
              src={heroMedia.desktopVideo}
              type="video/mp4"
              media="(min-width: 768px)"
            />
          </video>
        </>
      )}
    </div>
  );
}
