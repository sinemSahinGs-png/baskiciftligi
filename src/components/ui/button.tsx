import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-semibold tracking-[-0.01em] whitespace-nowrap transition-[color,background-color,transform,box-shadow] duration-200 outline-none select-none active:translate-y-px focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-cobalt text-light-text hover:bg-[#3144e6]",
        commerce:
          "bg-coral text-light-text hover:bg-brand-hover",
        outline:
          "border-current/25 bg-transparent hover:bg-white/10",
        technical:
          "border-white/20 bg-transparent text-light-text hover:bg-white/8",
        secondary:
          "bg-neutral text-ink hover:bg-[#dcd9d2]",
        ghost:
          "text-current/80 hover:bg-white/10 hover:text-current",
        destructive:
          "bg-error/10 text-error hover:bg-error/15",
        link: "text-current underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5",
        xs: "h-7 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3.5 text-[0.8125rem]",
        lg: "h-12 gap-2 px-6 text-[0.9375rem]",
        icon: "size-11",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
