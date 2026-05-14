import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[6px] text-sm font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-150 outline-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[var(--button-primary-hover-bg)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive)_90%,black)] focus-visible:ring-destructive",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-[var(--button-outline-hover-bg)]",
        secondary:
          "border border-border bg-secondary text-secondary-foreground shadow-[var(--shadow-xs)] hover:border-[var(--button-secondary-hover-border)] hover:shadow-[var(--shadow-sm)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        accent:
          "bg-accent text-accent-foreground hover:bg-[var(--button-accent-hover-bg)]",
        "on-dark":
          "bg-[var(--neutral-1)] text-primary hover:bg-[color-mix(in_oklch,var(--neutral-1)_90%,transparent)]",
        "ghost-dark":
          "border border-[color-mix(in_oklch,var(--neutral-1)_30%,transparent)] bg-transparent text-[var(--neutral-1)] hover:border-[color-mix(in_oklch,var(--neutral-1)_50%,transparent)] hover:bg-[color-mix(in_oklch,var(--neutral-1)_8%,transparent)]",
      },
      size: {
        default: "h-[38px] px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
