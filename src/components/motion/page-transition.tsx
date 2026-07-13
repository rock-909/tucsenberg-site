"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Route-change enter animation. Implemented with a CSS keyframe
 * (`.animate-page-enter` in globals.css) instead of `motion/react`, so the
 * site-wide navigation shell no longer ships the motion runtime on every page.
 *
 * The first paint (motionKey === 0) renders without the animation class to keep
 * the initial/LCP render static. Each client-side navigation bumps the key so
 * the wrapper remounts and the CSS animation replays. prefers-reduced-motion is
 * honored by the global reduced-motion reset in globals.css.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
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

  return (
    <div
      key={motionKey}
      className={motionKey === 0 ? undefined : "animate-page-enter"}
    >
      {children}
    </div>
  );
}
