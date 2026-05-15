"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type SeparatorProps = React.ComponentPropsWithoutRef<
  typeof SeparatorPrimitive.Root
>;

const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      data-slot="separator"
      data-ui-pilot="radix-primitive-separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = "Separator";

export { Separator };
