import { TextField } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef, Ref } from "react";
import { cn } from "@/lib/utils";
import { RadixThemePilot } from "@/components/ui/radix-theme";

type TextualInputType =
  | "date"
  | "datetime-local"
  | "email"
  | "month"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week";

const TEXTUAL_INPUT_TYPES = new Set<string>([
  "date",
  "datetime-local",
  "email",
  "month",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "time",
  "url",
  "week",
]);

function isTextualInputType(
  type: string | undefined,
): type is TextualInputType {
  return type === undefined || TEXTUAL_INPUT_TYPES.has(type);
}

interface InputProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "color" | "size"
> {
  className?: string;
  ref?: Ref<HTMLInputElement> | undefined;
}

function Input({
  className,
  defaultValue,
  ref,
  type,
  value,
  ...props
}: InputProps) {
  if (isTextualInputType(type)) {
    const defaultValueProps =
      typeof defaultValue === "string" || typeof defaultValue === "number"
        ? { defaultValue }
        : {};
    const valueProps =
      typeof value === "string" || typeof value === "number" ? { value } : {};

    return (
      <RadixThemePilot className="contents" surface="form-control">
        <TextField.Root
          className={cn("w-full", className)}
          data-slot="input"
          radius="medium"
          ref={ref}
          size="3"
          type={type}
          variant="surface"
          {...defaultValueProps}
          {...valueProps}
          {...props}
        />
      </RadixThemePilot>
    );
  }

  const nativeValueProps = type === "file" ? {} : { defaultValue, value };

  return (
    <input
      type={type}
      data-slot="input"
      ref={ref}
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-4 py-1 text-base shadow-[var(--shadow-xs)] transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...nativeValueProps}
      {...props}
    />
  );
}

Input.displayName = "Input";

export { Input };
