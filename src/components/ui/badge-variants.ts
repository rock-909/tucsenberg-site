import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success:
          "border-[var(--success-border)] bg-[var(--success-muted)] text-[var(--success-foreground)]",
        warning:
          "border-[var(--warning-border)] bg-[var(--warning-muted)] text-[var(--warning-foreground)]",
        destructive:
          "border-[var(--error-border)] bg-[var(--error-muted)] text-[var(--error-foreground)]",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
