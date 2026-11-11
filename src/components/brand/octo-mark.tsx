import { cn } from "@/lib/utils";

export function OctoMark({
  className,
  glow = false,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn(glow && "octo-mark-glow", className)}
    >
      <circle cx="32" cy="28" r="14.5" stroke="currentColor" strokeWidth="3.2" />
      <path
        d="M46.2 34.4c4.8 3.2 9.6 10.1 8.4 18.2-1.8-.8-3.6-2.6-4.4-4.8-1.6 4.8-4.2 8.2-8.2 10.4.2-4.6-.6-8.2-2.8-11.4-2.4-3.6-5.2-5.4-8.2-6.2 5.6-1.6 11.2.2 15.2-6.2Z"
        fill="currentColor"
      />
      <circle cx="32" cy="28" r="4.2" fill="currentColor" />
    </svg>
  );
}
