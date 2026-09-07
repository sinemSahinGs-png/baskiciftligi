"use client";

import { useEffect, useRef, useState } from "react";

import { SlotImage } from "@/components/home-industrial/slot-image";
import { heroMedia } from "@/components/home-industrial/hero-media";

function saveDataEnabled() {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return Boolean(connection?.saveData);
}

export function HeroVideo({ reducedMotion }: { reducedMotion: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [kind, setKind] = useState<"mobile" | "desktop" | null>(null);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const [hidden, setHidden] = useState(false);
  const showVideo = Boolean(src) && !failed && !reducedMotion && !hidden && inView;

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
    if (reducedMotion || saveDataEnabled()) {
      return;
    }
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const next = isMobile
      ? { src: heroMedia.mobileVideo, kind: "mobile" as const }
      : { src: heroMedia.desktopVideo, kind: "desktop" as const };
    const timer = window.setTimeout(() => {
      setSrc(next.src);
      setKind(next.kind);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (showVideo) {
      void video.play().catch(() => setFailed(true));
      return;
    }
    video.pause();
  }, [showVideo, src]);

  return (
    <div ref={rootRef} className="hi-hero-media" aria-hidden="true">
      <div data-industrial-asset="hero-wireframe-vase" className="hi-hero-still">
        <SlotImage
          src={heroMedia.fallback}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_72%] md:object-[50%_58%]"
        />
      </div>
      {src && !reducedMotion && !failed ? (
        <video
          ref={videoRef}
          className="hi-hero-video"
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={heroMedia.fallback}
          data-hero-video={kind ?? "pending"}
          controls={false}
          disablePictureInPicture
          onError={() => setFailed(true)}
        >
          <source src={src} type="video/mp4" data-hero-video-source={kind ?? "unknown"} />
        </video>
      ) : null}
    </div>
  );
}
