/** AVIF filenames present in `public/images/home-industrial`. Empty until final art is dropped. */
const READY = new Set<string>();

export function industrialSlotSrc(file: string): string | undefined {
  return READY.has(file) ? `/images/home-industrial/${file}` : undefined;
}
