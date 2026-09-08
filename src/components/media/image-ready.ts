export function imageIsReady(image: {
  complete: boolean;
  naturalWidth: number;
  naturalHeight: number;
}) {
  return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
}
