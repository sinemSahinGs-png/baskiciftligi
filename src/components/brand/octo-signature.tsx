"use client";

import { useReducedMotion } from "motion/react";

export function OctoSignature({ className }: { className?: string }) {
  const reduce = useReducedMotion() === true;
  return (
    <svg
      className={className ?? "octo-signature"}
      viewBox="0 0 800 480"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, index) => {
        const start = 40 + index * 18;
        return (
          <path
            key={index}
            d={`M400 240 C ${220 - index * 12} ${start}, ${120 + index * 8} ${380 - index * 18}, ${90 + index * 10} 460`}
            strokeDasharray={reduce ? "none" : "6 14"}
            style={{ animationDelay: `${index * 0.18}s` }}
          />
        );
      })}
      <circle cx="400" cy="240" r="46" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.35" />
    </svg>
  );
}
