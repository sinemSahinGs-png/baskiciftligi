import { industrialAssets } from "@/components/home-industrial/industrial-slots";

export const HERO_IDEA_EXAMPLES = [
  "Beyaz Yatak Odası Lambası",
  "Ejderha Şeklinde Telefon Standı",
  "İsme Özel Anahtarlık",
  "Masaüstü Kulaklık Standı",
  "Minimal Saksı ve Kalemlik",
] as const;

export const HERO_TYPEWRITER = {
  typeMin: 65,
  typeMax: 90,
  deleteMin: 30,
  deleteMax: 45,
  pauseCompleteMin: 1500,
  pauseCompleteMax: 2200,
  pauseEmptyMin: 350,
  pauseEmptyMax: 550,
  initialDelay: 600,
  restartDelay: 4000,
} as const;

export const heroMedia = {
  desktopVideo: "/videos/home-industrial/hero-desktop.mp4",
  mobileVideo: "/videos/home-industrial/hero-mobile.mp4",
  poster: "/images/home-industrial/hero-video-poster.png",
  fallback: industrialAssets.heroWireframeVase,
} as const;

export function pickHeroVideoSrc({
  isMobile,
  mobileOk,
  desktopOk,
}: {
  isMobile: boolean;
  mobileOk: boolean;
  desktopOk: boolean;
}) {
  if (isMobile) {
    if (mobileOk) return { src: heroMedia.mobileVideo, kind: "mobile" as const };
    if (desktopOk) return { src: heroMedia.desktopVideo, kind: "desktop" as const };
    return null;
  }
  if (desktopOk) return { src: heroMedia.desktopVideo, kind: "desktop" as const };
  if (mobileOk) return { src: heroMedia.mobileVideo, kind: "mobile" as const };
  return null;
}

export function vary(min: number, max: number, rng = Math.random) {
  return min + Math.round(rng() * (max - min));
}
