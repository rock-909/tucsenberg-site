import { forwardRef, type HTMLAttributes } from "react";
import { type VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs leading-4 font-medium",
          badgeVariants({ variant }),
          className,
        )}
        data-slot="badge"
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

export { Badge };
