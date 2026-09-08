"use client";

import type { Route } from "next";
import Link, { type LinkProps } from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { trackHomeEvent, type HomeAnalyticsName } from "@/lib/home/analytics";

export function HomeTrackLink({
  event,
  href,
  children,
  className,
  ...rest
}: {
  event?: HomeAnalyticsName;
  href: LinkProps<string>["href"];
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<"a">, "href" | "onClick">) {
  return (
    <Link
      href={href as Route}
      className={className}
      onClick={() => {
        if (event) trackHomeEvent({ name: event });
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
