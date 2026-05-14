import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable section header.
 *
 * - `layout="stack"` (default when no action): title + subtitle stacked
 * - When `action` is provided: row layout with action button right-aligned
 */
export function SectionHead({
  title,
  subtitle,
  action,
  className,
}: SectionHeadProps) {
  if (action) {
    return (
      <div
        className={cn("mb-9 flex items-end justify-between gap-6", className)}
      >
        <div>
          <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.02em]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-[560px] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    );
  }

  return (
    <div className={cn("mb-9", className)}>
      <h2 className="text-[32px] font-bold leading-[1.2] tracking-[-0.02em]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 max-w-[560px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
