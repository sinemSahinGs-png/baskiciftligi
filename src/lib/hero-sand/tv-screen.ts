export const OCTO_TV_SOURCE = {
  width: 1803,
  height: 872,
  path: "/images/hero/octo-tv-sand-shell-source.png",
} as const;

export const OCTO_TV_SHELL = {
  desktop: "/images/hero/octo-tv-sand-shell-desktop.webp",
  mobile: "/images/hero/octo-tv-sand-shell-mobile.webp",
} as const;

export const OCTO_SAND_FIELD = "/images/hero/octo-sand-field.webp";

/** Inner CRT glass after a 14px inset from the measured black walk. */
export const OCTO_TV_SCREEN_PX = {
  left: 556,
  top: 124,
  right: 1236,
  bottom: 718,
} as const;

export const OCTO_TV_SCREEN_DESKTOP = {
  left: 0.308375,
  top: 0.142202,
  width: 0.377704,
  height: 0.682339,
  radius: 0.062,
} as const;

export const OCTO_TV_SCREEN_MOBILE = {
  left: 0.13913,
  top: 0.142202,
  width: 0.740217,
  height: 0.682339,
  radius: 0.07,
} as const;

export const OCTO_TV_MOBILE_MEDIA = "(max-width: 767.98px)";

export function readTvScreenFromStyles(source: CSSStyleDeclaration) {
  const read = (name: string, fallback: number) => {
    const raw = source.getPropertyValue(name).trim();
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value / 100 : fallback;
  };
  return {
    left: read("--octo-tv-screen-left", OCTO_TV_SCREEN_DESKTOP.left),
    top: read("--octo-tv-screen-top", OCTO_TV_SCREEN_DESKTOP.top),
    width: read("--octo-tv-screen-width", OCTO_TV_SCREEN_DESKTOP.width),
    height: read("--octo-tv-screen-height", OCTO_TV_SCREEN_DESKTOP.height),
    radius: read("--octo-tv-screen-radius", OCTO_TV_SCREEN_DESKTOP.radius),
  };
}

export function tvScreenCssVars(screen: {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}) {
  return {
    "--octo-tv-screen-left": `${(screen.left * 100).toFixed(4)}%`,
    "--octo-tv-screen-top": `${(screen.top * 100).toFixed(4)}%`,
    "--octo-tv-screen-width": `${(screen.width * 100).toFixed(4)}%`,
    "--octo-tv-screen-height": `${(screen.height * 100).toFixed(4)}%`,
    "--octo-tv-screen-radius": `${(screen.radius * 100).toFixed(2)}%`,
  } as Record<string, string>;
}
