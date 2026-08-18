import type { CSSProperties } from "react";

export type CategoryImageFit = "cover" | "contain";

export interface CategoryImagePresentation {
  fit: CategoryImageFit;
  scale: number;
  positionX: number;
  positionY: number;
}

export const defaultCategoryImagePresentation: CategoryImagePresentation = {
  fit: "cover",
  scale: 100,
  positionX: 50,
  positionY: 50,
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

export function parseObjectPosition(value?: string | null): {
  x: number;
  y: number;
} {
  const match = value?.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!match) {
    return { x: 50, y: 50 };
  }
  return {
    x: clamp(Number(match[1]), 0, 100),
    y: clamp(Number(match[2]), 0, 100),
  };
}

export function formatObjectPosition(x: number, y: number): string {
  return `${clamp(x, 0, 100)}% ${clamp(y, 0, 100)}%`;
}

export function resolveCategoryImagePresentation(input?: {
  imageFit?: string | null;
  imageScale?: number | null;
  objectPosition?: string | null;
} | null): CategoryImagePresentation {
  const position = parseObjectPosition(input?.objectPosition);
  return {
    fit: input?.imageFit === "contain" ? "contain" : "cover",
    scale: clamp(Math.round(input?.imageScale ?? 100), 50, 200),
    positionX: position.x,
    positionY: position.y,
  };
}

export function categoryImageFitClass(fit: CategoryImageFit): string {
  return fit === "contain" ? "object-contain" : "object-cover";
}

export function categoryImageStyle(
  presentation: CategoryImagePresentation,
): CSSProperties {
  const scale = presentation.scale / 100;
  return {
    objectPosition: formatObjectPosition(
      presentation.positionX,
      presentation.positionY,
    ),
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transformOrigin: `${presentation.positionX}% ${presentation.positionY}%`,
  };
}
