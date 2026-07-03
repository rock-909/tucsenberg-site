import { Card as RadixCard } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef, Ref } from "react";
import { RadixThemePilot } from "@/components/ui/radix-theme";
import { cn } from "@/lib/utils";

interface DataCardProps extends Omit<ComponentPropsWithoutRef<"div">, "color"> {
  ref?: Ref<HTMLDivElement> | undefined;
}

function DataCard({ className, ref, ...props }: DataCardProps) {
  return (
    <RadixThemePilot className="contents" surface="data-card">
      <RadixCard
        ref={ref}
        {...props}
        className={cn(
          "surface-card flex flex-col gap-6 overflow-hidden py-6",
          className,
        )}
        data-slot="data-card"
        size="3"
        variant="surface"
      />
    </RadixThemePilot>
  );
}

DataCard.displayName = "DataCard";

function DataCardHeader({ className, ref, ...props }: DataCardProps) {
  return (
    <div
      ref={ref}
      {...props}
      className={cn("grid auto-rows-min gap-1.5 px-6", className)}
      data-slot="data-card-header"
    />
  );
}

DataCardHeader.displayName = "DataCardHeader";

function DataCardTitle({ className, ref, ...props }: DataCardProps) {
  return (
    <div
      ref={ref}
      {...props}
      className={cn("leading-none font-semibold", className)}
      data-slot="data-card-title"
    />
  );
}

DataCardTitle.displayName = "DataCardTitle";

function DataCardDescription({ className, ref, ...props }: DataCardProps) {
  return (
    <div
      ref={ref}
      {...props}
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="data-card-description"
    />
  );
}

DataCardDescription.displayName = "DataCardDescription";

function DataCardContent({ className, ref, ...props }: DataCardProps) {
  return (
    <div
      ref={ref}
      {...props}
      className={cn("px-6", className)}
      data-slot="data-card-content"
    />
  );
}

DataCardContent.displayName = "DataCardContent";

export {
  DataCard,
  DataCardHeader,
  DataCardTitle,
  DataCardDescription,
  DataCardContent,
};
