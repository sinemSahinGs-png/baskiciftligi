"use client";

import { MotionConfig } from "motion/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { Toaster } from "sonner";

import { StatusAnnouncer } from "@/components/motion/status-announcer";
import { ScrollMotionProvider } from "@/components/motion/scroll-motion-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AppLocale } from "@/i18n/config";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: AppLocale;
  messages: AbstractIntlMessages;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Europe/Istanbul"
    >
      <MotionConfig reducedMotion="user">
        <ScrollMotionProvider>
        <TooltipProvider delay={250}>
          {children}
          <StatusAnnouncer />
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{
              className: "font-sans",
            }}
          />
        </TooltipProvider>
        </ScrollMotionProvider>
      </MotionConfig>
    </NextIntlClientProvider>
  );
}
