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
          "flex min-h-[80px] w-full rounded-[6px] border border-input bg-background px-3 py-2.5 text-[15px] ring-offset-background placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-within:ring-[3px] focus-within:ring-ring/20 focus-within:border-ring",
          "has-[textarea:disabled]:cursor-not-allowed has-[textarea:disabled]:opacity-50",
          "has-[textarea[aria-invalid=true]]:border-destructive has-[textarea[aria-invalid=true]]:ring-destructive/20 dark:has-[textarea[aria-invalid=true]]:ring-destructive/40",
          className,
        )}
        radius="small"
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
