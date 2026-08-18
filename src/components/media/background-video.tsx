"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

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

function canAutoplayVideo(reduceMotion: boolean | null) {
  if (reduceMotion !== false || typeof navigator === "undefined") {
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
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canPlayVideo = useSyncExternalStore(
    emptySubscribe,
    () => canAutoplayVideo(reduceMotion),
    () => false,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlayVideo) {
      return;
    }

    let visible = false;
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
      { threshold: 0.12, rootMargin: "80px 0px" },
    );

    observer.observe(video);
    document.addEventListener("visibilitychange", updatePlayback);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
      video.pause();
    };
  }, [canPlayVideo, mp4Src, webmSrc]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-ink", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterSrc}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      {canPlayVideo ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={posterSrc}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        >
          {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
          <source src={mp4Src} type="video/mp4" />
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
