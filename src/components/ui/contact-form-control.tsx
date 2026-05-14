import { TextArea as RadixTextArea, TextField } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ContactFormTextInputType =
  | "date"
  | "datetime-local"
  | "email"
  | "hidden"
  | "month"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week";

interface ContactFormTextInputProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "children" | "color" | "defaultValue" | "size" | "type" | "value"
> {
  className?: string;
  defaultValue?: string | number;
  type?: ContactFormTextInputType;
  value?: string | number;
}

interface ContactFormTextareaProps extends Omit<
  ComponentPropsWithoutRef<"textarea">,
  "children" | "color" | "defaultValue" | "value"
> {
  className?: string;
  defaultValue?: string;
  value?: string;
}

export function ContactFormTextInput({
  className,
  ...props
}: ContactFormTextInputProps) {
  return (
    <TextField.Root
      className={cn("w-full", className)}
      radius="large"
      size="3"
      variant="surface"
      {...props}
    />
  );
}

export function ContactFormTextarea({
  className,
  rows = 4,
  ...props
}: ContactFormTextareaProps) {
  return (
    <RadixTextArea
      className={cn("w-full", className)}
      radius="large"
      resize="vertical"
      rows={rows}
      size="3"
      variant="surface"
      {...props}
    />
  );
}
