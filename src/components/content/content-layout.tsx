import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Info,
  ShieldCheck,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealHeading } from "@/components/motion/reveal-words";
import { cn } from "@/lib/utils";

type PageAction = {
  href: Route;
  label: string;
  variant?: "default" | "commerce" | "outline";
};

type PageStatus = {
  label: string;
  tone?: "info" | "warning" | "safe";
};

type BackLink = {
  href: Route;
  label: string;
};

type ContentPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  status?: PageStatus;
  actions?: PageAction[];
  backLink?: BackLink;
  children?: ReactNode;
  width?: "default" | "reading";
};

const statusClasses = {
  info: "border-hairline bg-muted text-ink",
  warning: "border-coral/40 bg-coral/10 text-ink",
  safe: "border-success/25 bg-success/10 text-success",
} as const;

export function ContentPage({
  eyebrow,
  title,
  description,
  status,
  actions,
  backLink,
  children,
  width = "default",
}: ContentPageProps) {
  return (
    <main id="ana-icerik">
      <header className="shell border-b border-hairline pt-12 pb-10 sm:pt-16 sm:pb-14">
        {backLink ? (
          <Link
            href={backLink.href}
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {backLink.label}
          </Link>
        ) : null}

        <div className="max-w-5xl">
          <p className="eyebrow">{eyebrow}</p>
          {status ? (
            <div
              className={cn(
                "mt-6 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold",
                statusClasses[status.tone ?? "info"],
              )}
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-current"
              />
              {status.label}
            </div>
          ) : null}
          <RevealHeading
            as="h1"
            text={title}
            className="display-title mt-6 max-w-5xl"
          />
          <RevealCopy text={description} className="body-large mt-7 max-w-3xl" />

          {actions?.length ? (
            <div className="mt-9 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={buttonVariants({
                    variant: action.variant ?? "default",
                    size: "lg",
                  })}
                >
                  {action.label}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div
        className={cn(
          "shell pb-24 sm:pb-32",
          width === "reading" && "max-w-5xl",
        )}
      >
        {children}
      </div>
    </main>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title mt-4 text-foreground">{title}</h2>
      {description ? (
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

type StatusNoticeProps = {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning" | "safe";
  className?: string;
};

export function StatusNotice({
  title,
  children,
  tone = "info",
  className,
}: StatusNoticeProps) {
  const Icon =
    tone === "warning" ? CircleAlert : tone === "safe" ? ShieldCheck : Info;

  return (
    <aside
      className={cn(
        "grid gap-4 rounded-xl border border-hairline bg-paper p-5 sm:grid-cols-[auto_1fr] sm:p-6",
        tone === "warning" && "border-coral/30",
        tone === "safe" && "border-emerald-400/20",
        className,
      )}
      aria-label={title}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-md bg-muted text-ink",
          tone === "warning" && "bg-coral/15 text-coral",
          tone === "safe" && "bg-success/10 text-success",
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <div className="mt-2 text-sm leading-6 text-muted-foreground">
          {children}
        </div>
      </div>
    </aside>
  );
}

type ContentCardProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
  className?: string;
};

export function ContentCard({
  title,
  description,
  eyebrow,
  children,
  className,
}: ContentCardProps) {
  return (
    <article
      className={cn("rounded-xl border border-hairline bg-paper p-6 sm:p-7", className)}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold text-ink-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-2 font-heading text-xl font-semibold text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}

type NumberedStepsProps = {
  steps: Array<{
    title: string;
    description: string;
  }>;
};

export function NumberedSteps({ steps }: NumberedStepsProps) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline lg:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="bg-paper p-6 sm:p-8">
          <span className="tabular text-xs font-semibold text-ink-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-5 font-heading text-xl font-semibold">
            {step.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}

type ScoreMeterProps = {
  label: string;
  value: number;
};

export function ScoreMeter({ label, value }: ScoreMeterProps) {
  const safeValue = Math.max(0, Math.min(5, value));

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular font-semibold text-foreground">
          {safeValue}/5
        </span>
      </div>
      <div
        className="mt-2 grid grid-cols-5 gap-1.5"
        role="img"
        aria-label={`${label}: 5 üzerinden ${safeValue}`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              "h-1.5 rounded-full bg-muted",
              index < safeValue && "bg-ink",
            )}
          />
        ))}
      </div>
    </div>
  );
}

type TextLinkProps = {
  href: Route;
  children: ReactNode;
  className?: string;
};

export function TextLink({ href, children, className }: TextLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}
