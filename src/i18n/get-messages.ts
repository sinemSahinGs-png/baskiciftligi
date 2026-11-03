import type { AbstractIntlMessages } from "next-intl";

import { defaultLocale, type AppLocale } from "@/i18n/config";
import ar from "@/i18n/messages/ar.json";
import en from "@/i18n/messages/en.json";
import tr from "@/i18n/messages/tr.json";

const catalog: Record<AppLocale, AbstractIntlMessages> = {
  tr: tr as AbstractIntlMessages,
  en: en as AbstractIntlMessages,
  ar: ar as AbstractIntlMessages,
};

export function getMessages(locale: AppLocale): AbstractIntlMessages {
  return catalog[locale] ?? catalog[defaultLocale];
}

export function msg(messages: AbstractIntlMessages, key: string): string {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);
  return typeof value === "string" ? value : key;
}
