import { Theme } from "@radix-ui/themes";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ThemeProps = ComponentProps<typeof Theme>;

export interface RadixThemePilotProps {
  children: ReactNode;
  className?: string;
}

export function RadixThemePilot({ children, className }: RadixThemePilotProps) {
  return (
    <Theme
      accentColor="blue"
      appearance="inherit"
      className={cn("showcase-radix-theme-pilot", className)}
      data-testid="radix-theme-pilot"
      data-ui-pilot="radix-themes-contact-form"
      grayColor="slate"
      hasBackground={false}
      panelBackground="solid"
      radius="large"
      scaling="100%"
    >
      {children}
    </Theme>
  );
}

export type RadixThemePilotAppearance = ThemeProps["appearance"];
