"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { IDLE_CALLBACK_FALLBACK_DELAY } from "@/constants/time";
import { requestIdleCallback } from "@/lib/idle-callback";
import type { ThemeSwitcherProps } from "@/components/ui/theme-switcher";

const LazyLoadedThemeSwitcher = lazy(async () => {
  const themeSwitcherModule = await import("@/components/ui/theme-switcher");
  return { default: themeSwitcherModule.ThemeSwitcher };
});

export function LazyThemeSwitcher(props: ThemeSwitcherProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    return requestIdleCallback(() => setShouldRender(true), {
      fallbackDelay: IDLE_CALLBACK_FALLBACK_DELAY,
      timeout: IDLE_CALLBACK_FALLBACK_DELAY,
    });
  }, []);

  if (!shouldRender) return null;

  return (
    <Suspense fallback={null}>
      <LazyLoadedThemeSwitcher {...props} />
    </Suspense>
  );
}
