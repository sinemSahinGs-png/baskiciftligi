export const locales = ["tr"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "tr";

export function isAppLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}
