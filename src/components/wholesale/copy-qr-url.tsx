"use client";

import { useState } from "react";

import { WHOLESALE_CATALOG_COPY } from "@/lib/wholesale/catalog";

export function CopyQrUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="wc-copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Kopyalandı" : WHOLESALE_CATALOG_COPY.copyLinkLabel}
    </button>
  );
}
