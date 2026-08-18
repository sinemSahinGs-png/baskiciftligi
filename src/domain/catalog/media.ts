import type {
  MediaRole,
  Product,
  ProductMedia,
  ProductPresentation,
} from "@/domain/catalog/types";
import {
  isStagePreset,
  stageForProduct,
  type StagePreset,
} from "@/domain/visual/stages";

const mediaRoles: MediaRole[] = [
  "primary",
  "hover",
  "mobile",
  "gallery",
  "video",
];

export function isMediaRole(value: unknown): value is MediaRole {
  return typeof value === "string" && mediaRoles.includes(value as MediaRole);
}

export function parseProductPresentation(
  metadata: Record<string, unknown>,
): ProductPresentation | undefined {
  const stagePreset = isStagePreset(metadata.stage_preset)
    ? metadata.stage_preset
    : undefined;
  const objectPosition =
    typeof metadata.object_position === "string"
      ? metadata.object_position
      : undefined;
  const mobileObjectPosition =
    typeof metadata.mobile_object_position === "string"
      ? metadata.mobile_object_position
      : undefined;
  const isolated =
    typeof metadata.isolated === "boolean" ? metadata.isolated : undefined;

  if (
    !stagePreset &&
    !objectPosition &&
    !mobileObjectPosition &&
    isolated === undefined
  ) {
    return undefined;
  }

  return { stagePreset, objectPosition, mobileObjectPosition, isolated };
}

export function parseMediaPresentation(
  metadata: Record<string, unknown> | undefined,
  index: number,
): Pick<
  ProductMedia,
  "role" | "objectPosition" | "mobileObjectPosition" | "isolated"
> {
  const item = Array.isArray(metadata?.media)
    ? metadata.media[index]
    : undefined;
  const record =
    item && typeof item === "object" && !Array.isArray(item)
      ? (item as Record<string, unknown>)
      : {};

  return {
    role: isMediaRole(record.role)
      ? record.role
      : index === 0
        ? "primary"
        : undefined,
    objectPosition:
      typeof record.object_position === "string"
        ? record.object_position
        : undefined,
    mobileObjectPosition:
      typeof record.mobile_object_position === "string"
        ? record.mobile_object_position
        : undefined,
    isolated: typeof record.isolated === "boolean" ? record.isolated : undefined,
  };
}

export function serializeMediaPresentation(media: ProductMedia[]) {
  return media.map((item) => ({
    role: item.role,
    object_position: item.objectPosition,
    mobile_object_position: item.mobileObjectPosition,
    isolated: item.isolated,
  }));
}

export interface ProductVisual {
  stage: StagePreset;
  primary?: ProductMedia;
  hover?: ProductMedia;
  mobile?: ProductMedia;
  video?: ProductMedia;
  isolated: boolean;
  objectPosition?: string;
  mobileObjectPosition?: string;
}

export function resolveProductVisual(product: Product): ProductVisual {
  const images = product.media
    .filter((item) => item.type === "image")
    .sort((left, right) => left.position - right.position);
  const videos = product.media.filter(
    (item) => item.type === "video" || item.role === "video",
  );
  const primary =
    images.find((item) => item.role === "primary") ?? images[0];
  const hover =
    images.find((item) => item.role === "hover" && item.id !== primary?.id) ??
    images.find((item) => item.id !== primary?.id);
  const mobile = images.find((item) => item.role === "mobile");
  const isolated =
    primary?.isolated ?? product.presentation?.isolated ?? false;

  return {
    stage: stageForProduct(product),
    primary,
    hover,
    mobile,
    video: videos[0],
    isolated,
    objectPosition:
      primary?.objectPosition ?? product.presentation?.objectPosition,
    mobileObjectPosition:
      primary?.mobileObjectPosition ??
      product.presentation?.mobileObjectPosition,
  };
}
