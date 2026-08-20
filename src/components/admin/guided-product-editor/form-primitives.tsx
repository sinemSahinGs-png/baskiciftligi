"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

import {
  minorUnitsToEditingString,
  parseEditablePriceInput,
} from "@/lib/catalog/price-input";

export const inputClass =
  "h-11 min-h-11 rounded-xl border-white/12 bg-black/20 px-3 text-sm focus-visible:border-cyan outline-none";
export const selectClass =
  "h-11 min-h-11 w-full rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm outline-none focus:border-cyan";

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-xs leading-5 text-destructive" role="alert" id={id}>
      {message}
    </p>
  );
}

export function MinorUnitInput({
  id,
  value,
  onChange,
  onBlur,
  allowEmpty = false,
  describedBy,
  errorId,
  className = inputClass,
}: {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur: () => void;
  allowEmpty?: boolean;
  describedBy?: string;
  errorId?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(() =>
    minorUnitsToEditingString(value),
  );
  const [error, setError] = useState<string>();
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDisplayValue(minorUnitsToEditingString(value));
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={displayValue}
        data-testid={id === "priceMinor" ? "price-input" : undefined}
        aria-describedby={
          [describedBy, error ? errorId ?? `${id}-error` : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-invalid={Boolean(error)}
        className={`${className} w-full pr-12 tabular-nums`}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => {
          const next = event.target.value;
          setDisplayValue(next);
          setError(undefined);

          const parsed = parseEditablePriceInput(next);
          if (parsed.ok) {
            onChange(parsed.minor ?? (allowEmpty ? null : 0));
          }
        }}
        onBlur={() => {
          focused.current = false;
          const parsed = parseEditablePriceInput(displayValue);

          if (!parsed.ok) {
            setError(parsed.error);
            onBlur();
            return;
          }

          const normalized = parsed.minor ?? (allowEmpty ? null : 0);
          onChange(normalized);
          setDisplayValue(minorUnitsToEditingString(normalized));
          setError(undefined);
          onBlur();
        }}
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
        TRY
      </span>
      <FieldError message={error} id={errorId ?? `${id}-error`} />
    </div>
  );
}

export function StepPanel({
  title,
  description,
  children,
  active,
  stepId,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  active: boolean;
  stepId: string;
}) {
  if (!active) {
    return null;
  }

  return (
    <section
      id={stepId}
      className="editor-step-active rounded-3xl border border-cyan/20 bg-card p-5 shadow-[0_0_0_1px_rgb(33_212_253/0.08),0_20px_60px_-30px_rgb(33_212_253/0.35)] sm:p-6"
      aria-labelledby={`${stepId}-title`}
      data-testid={stepId}
    >
      <header className="mb-6 border-b border-white/10 pb-5">
        <h2
          id={`${stepId}-title`}
          className="font-heading text-2xl font-medium tracking-[-0.03em]"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

export function CollapsibleGroup({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="rounded-2xl border border-white/10 bg-black/15"
    >
      <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="block text-sm font-semibold">{title}</span>
        {summary ? (
          <span className="mt-1 block text-xs text-muted-foreground">{summary}</span>
        ) : null}
      </summary>
      <div className="border-t border-white/10 p-4">{children}</div>
    </details>
  );
}

export function TextInput({
  className = inputClass,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={className} {...props} />;
}

export function toDateTimeLocal(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CharacterCounter({
  value,
  max,
  warnAt,
}: {
  value: string;
  max: number;
  warnAt?: number;
}) {
  const length = value.length;
  const threshold = warnAt ?? Math.floor(max * 0.85);
  if (length < threshold) {
    return null;
  }

  return (
    <p
      className={`text-right text-[0.65rem] tabular-nums ${
        length > max ? "text-destructive" : "text-muted-foreground"
      }`}
      aria-live="polite"
    >
      {length}/{max}
    </p>
  );
}
