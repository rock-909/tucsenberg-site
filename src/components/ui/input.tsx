"use client";

import * as React from "react";
import { TextField } from "@radix-ui/themes";
import { cn } from "@/lib/utils";

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

type NativeInputType =
  | "button"
  | "checkbox"
  | "color"
  | "file"
  | "hidden"
  | "image"
  | "radio"
  | "range"
  | "reset"
  | "submit";

type InputType = NativeInputType | TextualInputType;

interface InputProps extends Omit<
  React.ComponentProps<"input">,
  "children" | "color" | "defaultValue" | "size" | "type" | "value"
> {
  defaultValue?: string | number;
  type?: InputType;
  value?: string | number;
}

const NATIVE_INPUT_TYPES = new Set<string>([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function isNativeInputType(type: string | undefined): type is NativeInputType {
  return type !== undefined && NATIVE_INPUT_TYPES.has(type);
}

function Input({ className, type, ...props }: InputProps) {
  const classes = cn(
    "flex h-10 w-full min-w-0 rounded-[6px] border border-input bg-background px-3 py-2.5 text-[15px] shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
    "has-[input:disabled]:pointer-events-none has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
    "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20 dark:has-[input[aria-invalid=true]]:ring-destructive/40",
    className,
  );

  if (!isNativeInputType(type)) {
    return (
      <TextField.Root
        {...(type ? { type } : {})}
        data-slot="input"
        data-ui-pilot="radix-themes-form-control"
        className={classes}
        radius="small"
        size="3"
        variant="surface"
        {...props}
      />
    );
  }

  return <input type={type} data-slot="input" className={classes} {...props} />;
}

export { Input };
