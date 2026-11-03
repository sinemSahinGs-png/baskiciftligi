import { cookies, headers } from "next/headers";

import {
  defaultLocale,
  isAppLocale,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  type AppLocale,
} from "@/i18n/config";

export async function getRequestLocale(): Promise<AppLocale> {
  const header = (await headers()).get(LOCALE_HEADER);
  if (isAppLocale(header)) return header;
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isAppLocale(value) ? value : defaultLocale;
}
