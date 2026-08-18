import type { Route } from "next";
import Link from "next/link";
import { Asterisk } from "lucide-react";

import type { Announcement } from "@/domain/catalog/types";

interface AnnouncementBarProps {
  announcements: Announcement[];
}

export function AnnouncementBar({ announcements }: AnnouncementBarProps) {
  const activeAnnouncements = announcements
    .filter((announcement) => announcement.isActive)
    .sort((a, b) => a.position - b.position);

  if (activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Duyurular"
      className="relative z-50 overflow-hidden bg-cobalt text-light-text"
    >
      <div className="animate-announcement flex h-9 w-max min-w-[200%] items-center whitespace-nowrap motion-reduce:w-full motion-reduce:min-w-0 motion-reduce:animate-none motion-reduce:justify-center">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 || undefined}
            className="flex shrink-0 items-center motion-reduce:[&:not(:first-child)]:hidden"
          >
            {activeAnnouncements.map((announcement) => {
              const content = (
                <span className="inline-flex items-center gap-4 px-5 text-[0.8125rem] font-medium sm:px-8">
                  <span>{announcement.message}</span>
                  <Asterisk aria-hidden="true" className="size-3.5 shrink-0" />
                </span>
              );
              if (!announcement.href) {
                return (
                  <span key={`${copy}-${announcement.id}`}>{content}</span>
                );
              }
              return (
                <Link
                  key={`${copy}-${announcement.id}`}
                  href={announcement.href as Route}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="underline-offset-4 hover:underline"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
