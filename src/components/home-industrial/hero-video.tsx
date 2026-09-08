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

function revealIfPlaying(video: HTMLVideoElement, onReady: () => void) {
  if (video.error) return;
  if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    onReady();
  }
}

async function startPlayback(video: HTMLVideoElement) {
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  if (video.readyState === HTMLMediaElement.HAVE_NOTHING) {
    video.load();
  }
  try {
    await video.play();
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") return;
  }
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
    video.addEventListener("canplay", reveal);
    video.addEventListener("timeupdate", reveal);
    video.addEventListener("loadeddata", reveal);
    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      video.load();
    } else if (video.readyState === HTMLMediaElement.HAVE_NOTHING) {
      video.load();
    } else {
      reveal();
    }
    return () => {
      sources.forEach((source) => source.removeEventListener("error", fail));
      video.removeEventListener("error", fail);
      video.removeEventListener("playing", reveal);
      video.removeEventListener("canplay", reveal);
      video.removeEventListener("timeupdate", reveal);
      video.removeEventListener("loadeddata", reveal);
    };
  }, [failed]);

  useEffect(() => {
    const active = videoRef.current;
    if (!active) return;
    if (showVideo) {
      void startPlayback(active);
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
            autoPlay
            preload="auto"
            data-hero-video="responsive"
            data-ready={ready ? "true" : "false"}
            controls={false}
            disablePictureInPicture
            onPlaying={() => {
              const video = videoRef.current;
              if (video) revealIfPlaying(video, () => setReady(true));
            }}
            onCanPlay={() => {
              const video = videoRef.current;
              if (video) revealIfPlaying(video, () => setReady(true));
            }}
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
