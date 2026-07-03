import { TextArea as RadixTextArea } from "@radix-ui/themes";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { RadixThemePilot } from "@/components/ui/radix-theme";

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
      <RadixThemePilot className="contents" surface="form-control">
        <RadixTextArea
          className={cn("w-full", className)}
          data-slot="textarea"
          radius="large"
          ref={ref}
          resize="vertical"
          size="3"
          variant="surface"
          {...props}
        />
      </RadixThemePilot>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
