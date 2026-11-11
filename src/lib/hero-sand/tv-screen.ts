export const OCTO_TV_SOURCE = {
  width: 2400,
  height: 1144,
  path: "/images/hero/octo-tv-sand-shell-source.png",
} as const;

export const OCTO_TV_SHELL = {
  desktop: "/images/hero/octo-tv-sand-shell-desktop.webp",
  mobile: "/images/hero/octo-tv-sand-shell-mobile.webp",
  desktopWidth: 1830,
  desktopHeight: 872,
  mobileWidth: 1080,
  mobileHeight: 1920,
} as const;

export const OCTO_SAND_FIELD = "/images/hero/octo-sand-field.webp";

/** Inner CRT glass after a 19px inset from the measured black walk on the 2400×1144 source. */
export const OCTO_TV_SCREEN_PX = {
  left: 712,
  top: 106,
  right: 1701,
  bottom: 990,
} as const;

export const OCTO_TV_SCREEN_DESKTOP = {
  left: 0.296175,
  top: 0.091743,
  width: 0.412568,
  height: 0.775229,
  radius: 0.055,
} as const;

export const OCTO_TV_SCREEN_MOBILE = {
  left: 0.084259,
  top: 0.285417,
  width: 0.852778,
  height: 0.403646,
  radius: 0.045,
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
