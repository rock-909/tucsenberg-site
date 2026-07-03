"use client";

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

interface LightMotionProviderProps {
  children: ReactNode;
}

export function LightMotionProvider({ children }: LightMotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
