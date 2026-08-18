interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Yeniden dene",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-error/25 bg-paper p-6 sm:p-8"
    >
      <h2 className="font-heading text-2xl font-bold">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-secondary">
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-cobalt px-5 text-sm font-semibold text-light-text"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
