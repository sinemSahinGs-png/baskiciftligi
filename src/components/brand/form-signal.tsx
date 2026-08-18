import { cn } from "@/lib/utils";

interface FormSignalProps {
  className?: string;
  tone?: "light" | "dark" | "lime";
  spinning?: boolean;
}

export function FormSignal({
  className,
  tone = "light",
  spinning = false,
}: FormSignalProps) {
  const stroke =
    tone === "lime" ? "#C8F55A" : tone === "dark" ? "#111119" : "#F9F8F5";

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn(
        "size-5",
        spinning && "animate-orbit motion-reduce:animate-none",
        className,
      )}
    >
      <circle
        cx="16"
        cy="16"
        r="11"
        fill="none"
        stroke={stroke}
        strokeOpacity="0.28"
        strokeWidth="1.5"
        strokeDasharray="18 42"
      />
      <circle cx="25" cy="9" r="2.1" fill={stroke} />
      <path
        d="M8 21.5c2.4 3.2 6 5 8.4 4.2"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
