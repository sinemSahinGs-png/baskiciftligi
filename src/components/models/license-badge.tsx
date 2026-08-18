export function LicenseBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-current/20 px-2 py-1 text-xs font-semibold opacity-80">
      {label}
    </span>
  );
}
