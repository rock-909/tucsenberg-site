import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends Omit<
  ComponentPropsWithoutRef<"textarea">,
  "color" | "defaultValue" | "size" | "value"
> {
  className?: string;
  defaultValue?: string;
  value?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-20 w-full rounded-[9px] border border-transparent bg-card/95 px-3 py-2 text-base shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_20%,transparent)] transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 [&::placeholder]:text-[var(--neutral-8)]",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20 dark:aria-invalid:focus-visible:ring-destructive/40",
          className,
        )}
        data-slot="textarea"
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
