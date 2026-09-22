import type { Route } from "next";
import Link from "next/link";

import type { Announcement } from "@/domain/catalog/types";
import { COMMERCE_SHIPPING_POLICY, freeShippingThresholdDisabled } from "@/domain/commerce/shipping-policy";

interface AnnouncementBarProps {
  announcements: Announcement[];
}

export function isVerifiedAnnouncement(announcement: Announcement) {
  if (!announcement.isActive) return false;
  if (
    /ücretsiz kargo|ucretsiz kargo/i.test(announcement.message) &&
    freeShippingThresholdDisabled(COMMERCE_SHIPPING_POLICY.freeShippingThresholdMinor)
  ) {
    return false;
  }
  return true;
}

export function selectVerifiedAnnouncements(announcements: Announcement[]) {
  return announcements.filter(isVerifiedAnnouncement).sort((a, b) => a.position - b.position);
}

export function AnnouncementBar({ announcements }: AnnouncementBarProps) {
  const activeAnnouncements = selectVerifiedAnnouncements(announcements);

  if (activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <aside aria-label="Duyurular" className="site-announce">
      <div className="site-announce-rule" aria-hidden="true" />
      <div className="site-announce-row">
        {activeAnnouncements.map((announcement, index) => {
          const body = <span>{announcement.message}</span>;
          return (
            <span key={announcement.id} className="site-announce-item">
              {index > 0 ? <span className="site-announce-dot" aria-hidden="true" /> : null}
              {announcement.href ? (
                <Link href={announcement.href as Route} className="site-announce-link">
                  {body}
                </Link>
              ) : (
                body
              )}
            </span>
          );
        })}
      </div>
    </aside>
  );
}
