import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealHeading } from "@/components/motion/reveal-words";

interface AccountPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function AccountPageHeader({
  eyebrow,
  title,
  description,
}: AccountPageHeaderProps) {
  return (
    <header className="mb-8">
      <p className="text-sm text-ink-secondary">{eyebrow}</p>
      <RevealHeading
        as="h1"
        text={title}
        className="mt-3 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
      />
      <RevealCopy
        text={description}
        className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary sm:text-base"
      />
    </header>
  );
}

interface AccountEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  note?: string;
  action?: {
    href: "/" | "/hesabim" | "/hesabim/siparisler";
    label: string;
  };
}

export function AccountEmptyState({
  icon,
  title,
  description,
  note,
  action,
}: AccountEmptyStateProps) {
  return (
    <section className="rounded-xl border border-hairline bg-optical p-8 text-center sm:p-12">
      <div className="mx-auto mb-5 grid size-12 place-items-center rounded-md bg-muted text-ink-secondary">
        {icon}
      </div>
      <h2 className="font-heading text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-secondary">
        {description}
      </p>
      {note ? (
        <p className="mx-auto mt-5 max-w-xl rounded-md bg-canvas p-4 text-xs leading-5 text-ink-muted">
          {note}
        </p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
        >
          {action.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}
