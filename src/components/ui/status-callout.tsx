"use client";

import { Callout } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusCalloutTone = "info" | "success" | "warning" | "error";

type StatusCalloutProps = Omit<
  ComponentPropsWithoutRef<typeof Callout.Root>,
  "children" | "color"
> & {
  children: ReactNode;
  live?: boolean;
  tone?: StatusCalloutTone;
};

const toneColors = {
  info: "blue",
  success: "green",
  warning: "amber",
  error: "red",
} as const satisfies Record<
  StatusCalloutTone,
  ComponentPropsWithoutRef<typeof Callout.Root>["color"]
>;

const toneClasses = {
  info: "border-[var(--info-border)] bg-[var(--info-muted)] text-[var(--info-foreground)]",
  success:
    "border-[var(--success-border)] bg-[var(--success-muted)] text-[var(--success-foreground)]",
  warning:
    "border-[var(--warning-border)] bg-[var(--warning-muted)] text-[var(--warning-foreground)]",
  error:
    "border-[var(--error-border)] bg-[var(--error-muted)] text-[var(--error-foreground)]",
} as const satisfies Record<StatusCalloutTone, string>;

function getLiveRegionProps(tone: StatusCalloutTone, live: boolean) {
  if (!live) {
    return {};
  }

  if (tone === "error") {
    return {
      role: "alert",
      "aria-live": "assertive" as const,
    };
  }

  return {
    role: "status",
    "aria-live": "polite" as const,
  };
}

function StatusCallout({
  children,
  className,
  live = true,
  tone = "info",
  ...props
}: StatusCalloutProps) {
  return (
    <Callout.Root
      data-slot="status-callout"
      data-ui-pilot="radix-themes-status-callout"
      color={toneColors[tone]}
      size="2"
      variant="surface"
      className={cn("rounded-xl border p-4", toneClasses[tone], className)}
      {...getLiveRegionProps(tone, live)}
      {...props}
    >
      <div className="text-sm">{children}</div>
    </Callout.Root>
  );
}

export { StatusCallout };
export type { StatusCalloutProps, StatusCalloutTone };
