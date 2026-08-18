import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { href: Route; label: string };
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={
        compact
          ? "flex flex-col rounded-xl border border-white/12 bg-white/6 px-5 py-6"
          : "flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center"
      }
    >
      <span
        className={
          compact
            ? "mb-3 grid size-10 place-items-center rounded-md bg-current/10"
            : "mb-5 grid size-12 place-items-center rounded-md bg-current/10"
        }
      >
        {icon}
      </span>
      <h2
        className={
          compact
            ? "font-heading text-xl font-bold"
            : "font-heading text-2xl font-bold sm:text-3xl"
        }
      >
        {title}
      </h2>
      <p className="mt-3 max-w-md text-[0.95rem] leading-6 opacity-70">
        {description}
      </p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-cobalt px-5 text-sm font-semibold text-light-text"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
