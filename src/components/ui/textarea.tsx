"use client";

import { TextArea as RadixTextArea } from "@radix-ui/themes";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "children" | "color" | "defaultValue" | "value"
> {
  defaultValue?: string;
  value?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <RadixTextArea
        data-slot="textarea"
        data-ui-pilot="radix-themes-form-control"
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "has-[textarea:disabled]:cursor-not-allowed has-[textarea:disabled]:opacity-50",
          "has-[textarea[aria-invalid=true]]:border-destructive has-[textarea[aria-invalid=true]]:ring-destructive/20 dark:has-[textarea[aria-invalid=true]]:ring-destructive/40",
          className,
        )}
        radius="large"
        ref={ref}
        resize="vertical"
        size="3"
        variant="surface"
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
