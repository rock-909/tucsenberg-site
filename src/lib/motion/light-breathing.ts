/**
 * Shared motion tokens for the showcase starter "light breathing" tier.
 *
 * Calm, short, non-bouncy — aligned with tweakcn Twitter flat presentation.
 */

const LIGHT_BREATHING_EASE_X1 = 0.25;
const LIGHT_BREATHING_EASE_Y1 = 1;
const LIGHT_BREATHING_EASE_X2 = 0.5;
const LIGHT_BREATHING_EASE_Y2 = 1;

const LIGHT_BREATHING_EASE = [
  LIGHT_BREATHING_EASE_X1,
  LIGHT_BREATHING_EASE_Y1,
  LIGHT_BREATHING_EASE_X2,
  LIGHT_BREATHING_EASE_Y2,
] as const;

// Transform-only on purpose: content must remain visible even when the
// reveal never fires (no-JS, headless render, print). Motion governance
// forbids gating content visibility on animation.
export const lightBreathingItemVariants = {
  hidden: {
    y: 12,
  },
  visible: {
    y: 0,
  },
} as const;

export const lightBreathingStaggerChildren = 0.08;

export const lightBreathingRevealTransition = {
  duration: 0.45,
  ease: LIGHT_BREATHING_EASE,
} as const;

// The route-change (page enter) animation is now a pure-CSS keyframe
// (`.animate-page-enter` / `@keyframes pageEnter` in globals.css: 0.32s,
// cubic-bezier(0.25, 1, 0.5, 1), translateY(14px) -> 0). It no longer needs a
// motion/react token here, which keeps the motion runtime off non-home routes.

/**
 * Scroll reveal — first-pass timing (light, not delayed into the reading band).
 */
export const lightBreathingViewport = {
  once: true,
  margin: "-8% 0px -8% 0px",
  amount: 0.15,
} as const;

export function getInstantTransition(reducedMotion: boolean | null) {
  if (reducedMotion) {
    return { duration: 0 };
  }

  return lightBreathingRevealTransition;
}
