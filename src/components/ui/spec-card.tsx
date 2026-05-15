import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  DataCard,
  DataCardContent,
  DataCardHeader,
  DataCardTitle,
} from "@/components/ui/data-card";
import { cn } from "@/lib/utils";

interface SpecCardProps extends Omit<
  ComponentPropsWithoutRef<typeof DataCard>,
  "children" | "title"
> {
  children: ReactNode;
  title: ReactNode;
}

interface SpecCardRowProps extends ComponentPropsWithoutRef<"div"> {
  label: ReactNode;
  value: ReactNode;
}

function SpecCard({ children, className, title, ...props }: SpecCardProps) {
  return (
    <DataCard
      data-slot="spec-card"
      className={cn("overflow-hidden p-0", className)}
      {...props}
    >
      <DataCardHeader className="bg-muted/50 p-6">
        <DataCardTitle data-slot="spec-card-title" className="text-lg">
          {title}
        </DataCardTitle>
      </DataCardHeader>
      <DataCardContent className="p-0">
        <dl className="divide-y divide-border">{children}</dl>
      </DataCardContent>
    </DataCard>
  );
}

function SpecCardRow({ className, label, value, ...props }: SpecCardRowProps) {
  return (
    <div
      data-slot="spec-card-row"
      className={cn(
        "grid grid-cols-[1fr_2fr] gap-4 px-6 py-3 text-sm even:bg-muted/30",
        className,
      )}
      {...props}
    >
      <dt
        data-slot="spec-card-row-label"
        className="font-medium text-muted-foreground"
      >
        {label}
      </dt>
      <dd data-slot="spec-card-row-value" className="text-foreground">
        {value}
      </dd>
    </div>
  );
}

export { SpecCard, SpecCardRow };
export type { SpecCardProps, SpecCardRowProps };
