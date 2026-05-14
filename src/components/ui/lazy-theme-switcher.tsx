"use client";

import { useEffect, useState, type ComponentType } from "react";
import { IDLE_CALLBACK_FALLBACK_DELAY } from "@/constants/time";
import { requestIdleCallback } from "@/lib/idle-callback";
import type { ThemeSwitcherProps } from "@/components/ui/theme-switcher";

type ThemeSwitcherModule = {
  Component: ComponentType<ThemeSwitcherProps>;
};

export function LazyThemeSwitcher(props: ThemeSwitcherProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [module, setModule] = useState<ThemeSwitcherModule | null>(null);

  useEffect(() => {
    return requestIdleCallback(() => setShouldRender(true), {
      fallbackDelay: IDLE_CALLBACK_FALLBACK_DELAY,
      timeout: IDLE_CALLBACK_FALLBACK_DELAY,
    });
  }, []);

  useEffect(() => {
    if (!shouldRender || module) {
      return undefined;
    }

    let cancelled = false;

    const loadThemeSwitcher = async () => {
      const importedModule = await import("@/components/ui/theme-switcher");
      if (!cancelled) {
        setModule({ Component: importedModule.ThemeSwitcher });
      }
    };

    loadThemeSwitcher().catch(() => {
      // Ignore lazy import failures; theme switching is non-critical.
    });

    return () => {
      cancelled = true;
    };
  }, [module, shouldRender]);

  if (!shouldRender) return null;
  if (!module) return null;

  return <module.Component {...props} />;
}
