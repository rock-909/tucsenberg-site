import { describe, expect, it } from "vitest";

import {
  getInstantTransition,
  lightBreathingRevealTransition,
  lightBreathingStaggerChildren,
  lightBreathingViewport,
} from "@/lib/motion/light-breathing";

describe("light-breathing motion tokens", () => {
  it("keeps stagger intervals short for the restrained tier", () => {
    expect(lightBreathingStaggerChildren).toBeLessThanOrEqual(0.1);
  });

  it("keeps section reveals in the restrained timing band", () => {
    // The page-enter (route change) animation moved to a CSS keyframe
    // (globals.css, 0.32s); the section reveal token below stays the longer of
    // the two, matching the original "page transition faster than reveal"
    // relationship.
    expect(lightBreathingRevealTransition.duration).toBeGreaterThan(0.32);
    expect(lightBreathingRevealTransition.duration).toBeLessThanOrEqual(0.6);
  });

  it("uses the first-pass scroll reveal timing", () => {
    expect(lightBreathingViewport.amount).toBe(0.15);
    expect(lightBreathingViewport.margin).toBe("-8% 0px -8% 0px");
  });

  it("returns instant transitions when reduced motion is enabled", () => {
    expect(getInstantTransition(true)).toEqual({ duration: 0 });
  });
});
