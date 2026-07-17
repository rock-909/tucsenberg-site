import type { ComponentPropsWithoutRef, Ref } from "react";
import { cn } from "@/lib/utils";

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
  const valueProps = type === "file" ? {} : { defaultValue, value };

  return (
    <input
      type={type}
      data-slot="input"
      ref={ref}
      className={cn(
        "flex h-10 w-full min-w-0 rounded-[9px] border border-transparent bg-card/95 px-3 py-2 text-base shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_20%,transparent)] transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 [&::placeholder]:text-[var(--neutral-8)]",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20 dark:aria-invalid:focus-visible:ring-destructive/40",
        className,
      )}
      {...valueProps}
      {...props}
    />
  );
}

Input.displayName = "Input";

export { Input };
