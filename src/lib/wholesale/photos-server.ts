import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import {
  WHOLESALE_PHOTOS,
  type WholesalePhoto,
} from "@/lib/wholesale/photos";

function publicFileExists(src: string) {
  return existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

export function resolveWholesalePhotoSrc(photo: WholesalePhoto): string | null {
  if (publicFileExists(photo.webpSrc)) {
    return photo.webpSrc;
  }
  if (publicFileExists(photo.originalSrc)) {
    return photo.originalSrc;
  }
  return null;
}

export function getWholesalePhotoStates() {
  return WHOLESALE_PHOTOS.map((photo) => ({
    ...photo,
    src: resolveWholesalePhotoSrc(photo),
  }));
}
