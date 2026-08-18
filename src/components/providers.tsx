"use client";

import { MotionConfig } from "motion/react";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "sonner";

import { StatusAnnouncer } from "@/components/motion/status-announcer";
import { ScrollMotionProvider } from "@/components/motion/scroll-motion-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import trMessages from "@/i18n/messages/tr.json";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider
      locale="tr"
      messages={trMessages}
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
