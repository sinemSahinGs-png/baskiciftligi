"use client";

import { useEffect, useRef, useState } from "react";

import { SlotImage } from "@/components/home-industrial/slot-image";
import { heroMedia, pickHeroVideoSrc } from "@/components/home-industrial/hero-media";

async function headOk(path: string) {
  try {
    const response = await fetch(path, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

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
  const [still, setStill] = useState<string>(heroMedia.fallback);
  const [inView, setInView] = useState(true);
  const [hidden, setHidden] = useState(false);
  const showVideo = Boolean(src) && !failed && !reducedMotion && !hidden && inView;

  useEffect(() => {
    void headOk(heroMedia.poster).then((ok) => {
      if (ok) setStill(heroMedia.poster);
    });
  }, []);

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
    let cancelled = false;
    void (async () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      let mobileOk = false;
      let desktopOk = false;
      if (isMobile) {
        mobileOk = await headOk(heroMedia.mobileVideo);
        if (!mobileOk) desktopOk = await headOk(heroMedia.desktopVideo);
      } else {
        desktopOk = await headOk(heroMedia.desktopVideo);
        if (!desktopOk) mobileOk = await headOk(heroMedia.mobileVideo);
      }
      if (cancelled) return;
      const picked = pickHeroVideoSrc({ isMobile, mobileOk, desktopOk });
      if (!picked) {
        setFailed(true);
        return;
      }
      setSrc(picked.src);
      setKind(picked.kind);
    })();
    return () => {
      cancelled = true;
    };
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
      <div data-industrial-asset="hero-wireframe-vase" className="absolute inset-0">
        <SlotImage
          src={still}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_62%] md:object-[50%_58%]"
          onError={() => {
            if (still !== heroMedia.fallback) setStill(heroMedia.fallback);
          }}
        />
      </div>
      {src && !reducedMotion ? (
        <video
          ref={videoRef}
          className="hi-hero-video"
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={still}
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
