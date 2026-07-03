import { Badge as RadixBadge } from "@radix-ui/themes";
import { forwardRef, type HTMLAttributes } from "react";
import { type VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge-variants";
import { RadixThemePilot } from "@/components/ui/radix-theme";
import { cn } from "@/lib/utils";

interface BadgeProps
  extends
    Omit<
      HTMLAttributes<HTMLSpanElement>,
      "color" | "defaultChecked" | "defaultValue"
    >,
    VariantProps<typeof badgeVariants> {
  autoComplete?: string;
  disabled?: boolean;
  form?: string;
  name?: string;
  value?: string;
}

const RADIX_BADGE_VARIANT = {
  default: "solid",
  secondary: "soft",
  success: "soft",
  warning: "soft",
  destructive: "surface",
  outline: "outline",
} as const;

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <RadixThemePilot className="contents" surface="badge">
        <RadixBadge
          ref={ref}
          className={cn(badgeVariants({ variant }), className)}
          data-slot="badge"
          radius="full"
          variant={RADIX_BADGE_VARIANT[variant ?? "default"]}
          {...props}
        />
      </RadixThemePilot>
    );
  },
);

Badge.displayName = "Badge";

export { Badge };
