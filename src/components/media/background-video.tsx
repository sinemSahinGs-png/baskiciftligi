"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

interface BackgroundVideoProps {
  mp4Src: string;
  webmSrc?: string;
  posterSrc: string;
  className?: string;
  overlayClassName?: string;
}

const emptySubscribe = () => () => undefined;

function canAutoplayVideo() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const connection = (
    navigator as Navigator & { connection?: NetworkInformation }
  ).connection;

  return !(
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  );
}

export function BackgroundVideo({
  mp4Src,
  webmSrc,
  posterSrc,
  className,
  overlayClassName,
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posterReady, setPosterReady] = useState(false);
  const canPlayVideo = useSyncExternalStore(
    emptySubscribe,
    canAutoplayVideo,
    () => false,
  );
  const showVideo = canPlayVideo && posterReady;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) {
      return;
    }

    const tryPlay = () => {
      if (document.visibilityState === "visible") {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };

    let visible = true;
    const updatePlayback = () => {
      if (visible && document.visibilityState === "visible") {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        updatePlayback();
      },
      { threshold: 0.01, rootMargin: "120px 0px" },
    );

    observer.observe(video);
    video.addEventListener("canplay", tryPlay);
    document.addEventListener("visibilitychange", updatePlayback);
    tryPlay();

    return () => {
      observer.disconnect();
      video.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", updatePlayback);
      video.pause();
    };
  }, [showVideo, mp4Src, webmSrc]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-ink", className)}>
      <Image
        src={posterSrc}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={70}
        className="object-cover"
        onLoad={() => setPosterReady(true)}
        onError={() => setPosterReady(true)}
      />
      {showVideo ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 size-full bg-transparent object-cover"
        >
          <source src={mp4Src} type="video/mp4" />
          {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
        </video>
      ) : null}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,13,0.55)_0%,rgba(8,10,13,0.28)_38%,rgba(8,10,13,0.72)_78%,rgba(8,10,13,0.94)_100%),linear-gradient(90deg,rgba(8,10,13,0.55)_0%,rgba(8,10,13,0.18)_48%,rgba(8,10,13,0.42)_100%)]",
          overlayClassName,
        )}
      />
    </div>
  );
}
