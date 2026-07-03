import { Card as RadixCard } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { RadixThemePilot } from "@/components/ui/radix-theme";
import { cn } from "@/lib/utils";

export interface ContactFormShellProps {
  children: ReactNode;
  className?: string;
}

export function ContactFormShell({
  children,
  className,
}: ContactFormShellProps) {
  return (
    <RadixThemePilot className="mx-auto w-full max-w-2xl">
      <RadixCard
        className={cn("min-w-0 w-full", className)}
        data-testid="contact-form-shell"
        size="3"
        variant="surface"
      >
        {children}
      </RadixCard>
    </RadixThemePilot>
  );
}
