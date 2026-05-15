import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "neutral";

const TONE_CLASS: Record<StatusTone, string> = {
  success:
    "bg-[var(--success-muted)] text-[var(--success-foreground)] border-[var(--success-border)]",
  warning:
    "bg-[var(--warning-muted)] text-[var(--warning-foreground)] border-[var(--warning-border)]",
  neutral: "bg-muted text-muted-foreground border-border",
};

/**
 * Compatibility fit / confidence indicator.
 *
 * Square 4px corners and bordered tint per DESIGN.md §徽章 — deliberately
 * not the pill-shaped shared `ui/badge` wrapper, which the no-pill design
 * rule excludes from compatibility data surfaces.
 */
export function StatusBadge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[12px] font-medium tracking-[0.16px]",
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

export const FIT_STATUS_TONE: Record<string, StatusTone> = {
  exact: "success",
  "verify-dimensions": "warning",
  custom: "neutral",
};

export const CONFIDENCE_TONE: Record<string, StatusTone> = {
  high: "success",
  medium: "warning",
  low: "neutral",
};
