"use client";

import { Card as RadixCard } from "@radix-ui/themes";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type DataCardProps = Omit<
  ComponentPropsWithoutRef<typeof RadixCard>,
  "children"
> & {
  children: ReactNode;
};

const DataCard = forwardRef<HTMLDivElement, DataCardProps>(
  ({ className, children, ...props }, ref) => (
    <RadixCard
      ref={ref}
      data-slot="data-card"
      data-ui-pilot="radix-themes-data-card"
      size="2"
      variant="surface"
      className={cn(
        "flex flex-col gap-6 rounded-xl border border-border/50 bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </RadixCard>
  ),
);
DataCard.displayName = "DataCard";

function DataCardHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="data-card-header"
      className={cn("space-y-1.5", className)}
      {...props}
    />
  );
}

function DataCardTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      data-slot="data-card-title"
      className={cn("text-base font-semibold text-card-foreground", className)}
      {...props}
    />
  );
}

function DataCardDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="data-card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function DataCardContent({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="data-card-content"
      className={cn("text-sm", className)}
      {...props}
    />
  );
}

export {
  DataCard,
  DataCardContent,
  DataCardDescription,
  DataCardHeader,
  DataCardTitle,
};
export type { DataCardProps };
