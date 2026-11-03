export const locales = ["tr", "en", "ar"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "tr";
export const prefixedLocales = ["en", "ar"] as const;
export const LOCALE_COOKIE = "bc_locale";
export const LOCALE_HEADER = "x-bc-locale";

export const localeMeta: Record<
  AppLocale,
  { html: string; dir: "ltr" | "rtl"; og: string; label: string; native: string }
> = {
  tr: { html: "tr", dir: "ltr", og: "tr_TR", label: "TR", native: "Türkçe" },
  en: { html: "en", dir: "ltr", og: "en_US", label: "EN", native: "English" },
  ar: { html: "ar", dir: "rtl", og: "ar_SA", label: "عر", native: "العربية" },
};

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && locales.includes(value as AppLocale));
}

export function isPrefixedLocale(
  value: string | null | undefined,
): value is (typeof prefixedLocales)[number] {
  return value === "en" || value === "ar";
}

export function splitLocalePath(pathname: string): {
  locale: AppLocale | null;
  pathname: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (isPrefixedLocale(first)) {
    const rest = `/${segments.slice(1).join("/")}`;
    return { locale: first, pathname: rest === "/" ? "/" : rest };
  }
  return { locale: null, pathname: pathname || "/" };
}

export function localePath(locale: AppLocale, pathname: string, search = ""): string {
  const { pathname: clean } = splitLocalePath(pathname);
  const base = isPrefixedLocale(locale)
    ? clean === "/"
      ? `/${locale}`
      : `/${locale}${clean}`
    : clean || "/";
  return `${base}${search}`;
}

export function isLocaleExemptPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth")
  );
}
