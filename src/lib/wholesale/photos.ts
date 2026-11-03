export type WholesalePhotoId = "stand" | "gallery-2" | "gallery-3";

export interface WholesalePhoto {
  id: WholesalePhotoId;
  originalSrc: string;
  webpSrc: string;
  alt: string;
  hero: boolean;
  width: number;
  height: number;
}

export const WHOLESALE_PHOTOS: WholesalePhoto[] = [
  {
    id: "stand",
    originalSrc: "/images/wholesale/lighters/originals/stand.jpg",
    webpSrc: "/images/wholesale/lighters/stand.webp",
    alt: "Tezgah üzerindeki satış standı, karışık model kaplamalı çakmaklarla dolu",
    hero: true,
    width: 1600,
    height: 1200,
  },
  {
    id: "gallery-2",
    originalSrc: "/images/wholesale/lighters/originals/gallery-2.jpg",
    webpSrc: "/images/wholesale/lighters/gallery-2.webp",
    alt: "Kaplamalı çakmakların yakından görünümü",
    hero: false,
    width: 1200,
    height: 1200,
  },
  {
    id: "gallery-3",
    originalSrc: "/images/wholesale/lighters/originals/gallery-3.jpg",
    webpSrc: "/images/wholesale/lighters/gallery-3.webp",
    alt: "Karışık model kaplamalı çakmaklar ve teşhir standı",
    hero: false,
    width: 1200,
    height: 1200,
  },
];

export const WHOLESALE_PHOTO_ORIGINALS = WHOLESALE_PHOTOS.map(
  (photo) => photo.originalSrc,
);

export const WHOLESALE_HERO_PHOTO = WHOLESALE_PHOTOS[0];
export const WHOLESALE_GALLERY_PHOTOS = WHOLESALE_PHOTOS.filter((photo) => !photo.hero);
