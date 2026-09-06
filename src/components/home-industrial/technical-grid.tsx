import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function TechnicalGrid({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("hi-grid", className)} />;
}

export function CadFrame({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("hi-frame", className)} {...props}>
      {children}
    </div>
  );
}

export function TechnicalPlaceholder({ className }: { className?: string }) {
  return (
    <div data-model-image-placeholder="" className={cn("hi-placeholder", className)}>
      <svg aria-hidden="true" viewBox="0 0 64 64" className="size-10">
        <path
          d="M32 8 L56 22 L56 42 L32 56 L8 42 L8 22 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M32 8 L32 56 M8 22 L32 36 L56 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
