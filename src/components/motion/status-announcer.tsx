"use client";

import { useEffect, useState } from "react";

import { announceEvent } from "@/lib/motion";

export function StatusAnnouncer() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onAnnounce = (event: Event) => {
      const detail =
        event instanceof CustomEvent && typeof event.detail === "string"
          ? event.detail
          : "";
      if (!detail) {
        return;
      }
      setMessage("");
      window.requestAnimationFrame(() => setMessage(detail));
    };

    window.addEventListener(announceEvent, onAnnounce);
    return () => window.removeEventListener(announceEvent, onAnnounce);
  }, []);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
