"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  lightBreathingItemVariants,
  lightBreathingStaggerChildren,
  lightBreathingStaggerTransition,
} from "@/lib/motion/light-breathing";

interface BreathingStaggerProps {
  children: ReactNode;
  className?: string;
}

interface BreathingStaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function BreathingStagger({
  children,
  className,
}: BreathingStaggerProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: lightBreathingStaggerChildren,
          },
        },
      }}
    >
      {children}
    </m.div>
  );
}

export function BreathingStaggerItem({
  children,
  className,
}: BreathingStaggerItemProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={cn(className)}
      variants={{
        hidden: lightBreathingItemVariants.hidden,
        visible: {
          ...lightBreathingItemVariants.visible,
          transition: lightBreathingStaggerTransition,
        },
      }}
    >
      {children}
    </m.div>
  );
}
