"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { SlotImage } from "@/components/home-industrial/slot-image";
import { heroMedia } from "@/components/home-industrial/hero-media";

const MOBILE_QUERY = "(max-width: 767.98px)";

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

function subscribeMobile(onStoreChange: () => void) {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function revealIfPlaying(video: HTMLVideoElement, onReady: () => void) {
  if (video.error || video.paused) return;
  if (video.currentTime > 0) onReady();
}

function pruneUnusedSources(video: HTMLVideoElement, isMobile: boolean) {
  const keep = isMobile ? heroMedia.mobileVideo : heroMedia.desktopVideo;
  for (const source of [...video.querySelectorAll("source")]) {
    const src = source.getAttribute("src");
    if (src && src !== keep) {
      source.remove();
    }
  }
  video.dataset.heroSlot = isMobile ? "mobile" : "desktop";
}

async function startPlayback(video: HTMLVideoElement) {
  video.defaultMuted = true;
  video.muted = true;
  video.setAttribute("muted", "");
  video.playsInline = true;
  if (!video.currentSrc && video.dataset.loadStarted !== "true") {
    video.dataset.loadStarted = "true";
    video.load();
  }
  try {
    await video.play();
    video.dataset.playRejection = "";
    return null;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    const message = error instanceof Error ? error.message : "play() rejected";
    video.dataset.playRejection = message;
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      return "media-error";
    }
    return message;
  }
}

export function HeroVideo({ reducedMotion }: { reducedMotion: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const saveData = useSyncExternalStore(
    subscribeSaveData,
    saveDataEnabled,
    () => false,
  );
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
  const eligible = !failed && !reducedMotion && !hidden && inView && !saveData;

  useLayoutEffect(() => {
    if (!hydrated) return;
    const video = videoRef.current;
    if (!video) return;
    pruneUnusedSources(video, isMobile);
  }, [hydrated, isMobile]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting));
      },
      { threshold: [0, 0.01, 0.12] },
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
    const reveal = () => revealIfPlaying(video, () => setReady(true));
    const sources = [...video.querySelectorAll("source")];
    sources.forEach((source) => source.addEventListener("error", fail));
    video.addEventListener("error", fail);
    video.addEventListener("playing", reveal);
    video.addEventListener("timeupdate", reveal);
    if (video.error) fail();
    return () => {
      sources.forEach((source) => source.removeEventListener("error", fail));
      video.removeEventListener("error", fail);
      video.removeEventListener("playing", reveal);
      video.removeEventListener("timeupdate", reveal);
    };
  }, [failed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!eligible) {
      video.pause();
      return;
    }
    if (hydrated) pruneUnusedSources(video, isMobile);
    void startPlayback(video).then((result) => {
      if (result === "media-error") setFailed(true);
    });
  }, [eligible, hydrated, isMobile]);

  return (
    <div
      ref={rootRef}
      className="hi-hero-media"
      aria-hidden="true"
      data-industrial-asset="hero-wireframe-vase"
    >
      {failed ? (
        <div className="hi-hero-still">
          <SlotImage
            src={heroMedia.fallback}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[46%_88%] sm:object-[50%_82%] md:object-[68%_48%]"
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
            preload="none"
            data-hero-video="responsive"
            data-ready={ready ? "true" : "false"}
            controls={false}
            disablePictureInPicture
            onPlaying={() => {
              const video = videoRef.current;
              if (video) revealIfPlaying(video, () => setReady(true));
            }}
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (video) revealIfPlaying(video, () => setReady(true));
            }}
            onError={() => setFailed(true)}
          >
            <source
              src={heroMedia.mobileVideo}
              type="video/mp4"
              media={MOBILE_QUERY}
              data-hero-src="mobile"
            />
            <source
              src={heroMedia.desktopVideo}
              type="video/mp4"
              media="(min-width: 768px)"
              data-hero-src="desktop"
            />
          </video>
        </>
      )}
    </div>
  );
}
