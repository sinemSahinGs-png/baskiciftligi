import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { href: Route; label: string };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-5 grid size-12 place-items-center rounded-md bg-current/10">
        {icon}
      </span>
      <h2 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-md text-[0.95rem] leading-6 opacity-70">
        {description}
      </p>
      {action ? (
        <Link
          href={action.href}
          className="mt-7 inline-flex min-h-11 items-center rounded-md bg-cobalt px-5 text-sm font-semibold text-light-text"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
