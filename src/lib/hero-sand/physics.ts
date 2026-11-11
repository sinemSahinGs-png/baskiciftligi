export const SAND_RESET_MS = 1600;
export const SAND_LOAD_TIMEOUT_MS = 5000;

export function chooseSandGrid({
  width,
  reducedMotion,
  saveData,
  webgl2,
}: {
  width: number;
  reducedMotion: boolean;
  saveData: boolean;
  webgl2: boolean;
}) {
  if (!webgl2 || reducedMotion || saveData) return 0;
  if (width < 480) return 256;
  if (width < 900) return 384;
  return 512;
}

export function chooseSandDpr(devicePixelRatio: number, width: number) {
  const cap = width < 768 ? 1.5 : 2;
  return Math.min(Math.max(devicePixelRatio || 1, 1), cap);
}

export function isHeroChrome(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "a, button, input, textarea, select, label, [role='button'], [data-octo-sand-ui], header, .store-bottom-nav",
    ),
  );
}

export function sandImpulseFromPointer({
  dx,
  dy,
  isTouch,
}: {
  dx: number;
  dy: number;
  isTouch: boolean;
}) {
  const dist = Math.hypot(dx, dy);
  if (dist < 0.45) {
    return { force: 0, nx: 0, ny: 0, scrolling: false };
  }
  const verticalScroll = isTouch && Math.abs(dy) > Math.abs(dx) * 1.25 && dist > 10;
  if (verticalScroll) {
    return { force: 0, nx: 0, ny: 0, scrolling: true };
  }
  const capped = Math.min(dist, 56);
  return {
    force: capped * 0.02,
    nx: dx / dist,
    ny: dy / dist,
    scrolling: false,
  };
}

export function supportsWebGl2(gl: WebGL2RenderingContext | null | undefined) {
  return Boolean(gl && gl instanceof WebGL2RenderingContext);
}

export function allowHeroDebug(hostname: string, search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.get("heroDebug") !== "1") return false;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  );
}
