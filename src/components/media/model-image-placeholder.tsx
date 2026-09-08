import { cn } from "@/lib/utils";

export function ModelImagePlaceholder({
  className,
  label = "3D model",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      data-model-image-placeholder=""
      className={cn(
        "absolute inset-0 grid place-items-center bg-[#ece6d8] text-[#3d4148]",
        className,
      )}
    >
      <div className="px-3 text-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 64 64"
          className="mx-auto size-10 text-[#0f6f6d]"
        >
          <path
            d="M32 8 L56 22 L56 42 L32 56 L8 42 L8 22 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M32 8 L32 56 M8 22 L32 36 L56 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
        {label ? (
          <span className="mt-2 block text-[0.75rem] font-semibold tracking-wide">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
