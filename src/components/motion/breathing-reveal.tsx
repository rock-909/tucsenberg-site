"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  getInstantTransition,
  lightBreathingItemVariants,
  lightBreathingViewport,
} from "@/lib/motion/light-breathing";

interface BreathingRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function BreathingReveal({
  children,
  className,
  delay = 0,
}: BreathingRevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={lightBreathingViewport}
      variants={{
        hidden: lightBreathingItemVariants.hidden,
        visible: {
          ...lightBreathingItemVariants.visible,
          transition: {
            ...getInstantTransition(reducedMotion),
            delay,
          },
        },
      }}
    >
      {children}
    </m.div>
  );
}
