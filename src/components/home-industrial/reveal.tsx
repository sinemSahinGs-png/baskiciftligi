export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["hi-reveal", className].filter(Boolean).join(" ")} data-hi-reveal="">
      {children}
    </div>
  );
}
