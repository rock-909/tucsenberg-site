"use client";

import { Badge as RadixBadge } from "@radix-ui/themes";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium tracking-[0.16px] transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "text-destructive-foreground border-transparent bg-destructive hover:bg-destructive/80",
        outline: "text-foreground hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends
    Omit<ComponentPropsWithoutRef<typeof RadixBadge>, "color" | "variant">,
    VariantProps<typeof badgeVariants> {
  // 支持额外的HTML属性，即使它们不是div的标准属性
  disabled?: boolean;
  form?: string;
  name?: string;
  value?: string;
  autoComplete?: string;
}

const badgeColors = {
  default: "blue",
  secondary: "gray",
  destructive: "red",
  outline: "gray",
} as const satisfies Record<
  NonNullable<BadgeProps["variant"]>,
  ComponentPropsWithoutRef<typeof RadixBadge>["color"]
>;

const radixBadgeVariants = {
  default: "solid",
  secondary: "soft",
  destructive: "solid",
  outline: "outline",
} as const satisfies Record<
  NonNullable<BadgeProps["variant"]>,
  ComponentPropsWithoutRef<typeof RadixBadge>["variant"]
>;

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    const selectedVariant = variant ?? "default";

    return (
      <RadixBadge
        ref={ref}
        data-slot="badge"
        data-ui-pilot="radix-themes-badge"
        color={badgeColors[selectedVariant]}
        radius="small"
        size="1"
        variant={radixBadgeVariants[selectedVariant]}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
