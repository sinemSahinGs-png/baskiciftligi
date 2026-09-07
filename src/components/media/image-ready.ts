export function imageIsReady(image: {
  complete: boolean;
  naturalWidth: number;
  naturalHeight: number;
}) {
  return image.complete && image.naturalWidth >= 8 && image.naturalHeight >= 8;
}
