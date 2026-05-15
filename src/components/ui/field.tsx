import {
  forwardRef,
  type ComponentProps,
  type ComponentPropsWithoutRef,
} from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function Field({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div data-slot="field" className={cn("space-y-2", className)} {...props} />
  );
}

function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("text-foreground", className)}
      {...props}
    />
  );
}

function FieldControl({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="field-control"
      className={cn("space-y-1", className)}
      {...props}
    />
  );
}

function FieldHint({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="field-hint"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="field-error"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    />
  );
}

const ErrorSummary = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div">
>(
  (
    {
      className,
      role = "alert",
      "aria-live": ariaLive = "assertive",
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-slot="error-summary"
        role={role}
        aria-live={ariaLive}
        className={cn(
          "rounded-xl border border-[var(--error-border)] bg-[var(--error-muted)] p-4 text-sm font-medium text-[var(--error-foreground)]",
          className,
        )}
        {...props}
      />
    );
  },
);
ErrorSummary.displayName = "ErrorSummary";

export { ErrorSummary, Field, FieldControl, FieldError, FieldHint, FieldLabel };
