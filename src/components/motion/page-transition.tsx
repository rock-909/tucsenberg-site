"use client";

import { m, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import {
  lightBreathingPageActive,
  lightBreathingPageEnter,
  lightBreathingPageEnterTransition,
} from "@/lib/motion/light-breathing";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const previousPathname = useRef<string | undefined>(undefined);
  const [motionKey, setMotionKey] = useState(0);

  useLayoutEffect(() => {
    if (
      previousPathname.current !== undefined &&
      previousPathname.current !== pathname
    ) {
      setMotionKey((current) => current + 1);
    }

    previousPathname.current = pathname;
  }, [pathname]);

  if (reducedMotion) {
    return children;
  }

  return (
    <m.div
      key={motionKey}
      initial={motionKey === 0 ? false : lightBreathingPageEnter}
      animate={lightBreathingPageActive}
      transition={lightBreathingPageEnterTransition}
    >
      {children}
    </m.div>
  );
}
