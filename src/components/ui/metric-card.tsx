import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { DataCard } from "@/components/ui/data-card";
import { cn } from "@/lib/utils";

interface MetricCardProps extends Omit<
  ComponentPropsWithoutRef<typeof DataCard>,
  "children"
> {
  description?: ReactNode;
  label: ReactNode;
  value: ReactNode;
}

function MetricCard({
  className,
  description,
  label,
  value,
  ...props
}: MetricCardProps) {
  return (
    <DataCard
      data-metric-card="true"
      className={cn("gap-3 p-4", className)}
      {...props}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-bold text-foreground">{value}</dd>
      <p
        data-slot="metric-card-description"
        className={cn(
          "text-sm text-muted-foreground",
          description === undefined && "sr-only",
        )}
      >
        {description ?? label}
      </p>
    </DataCard>
  );
}

export { MetricCard };
export type { MetricCardProps };
