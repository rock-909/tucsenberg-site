import { describe, expect, it } from "vitest";

import {
  lightBreathingItemVariants,
  lightBreathingRevealTransition,
  lightBreathingViewport,
} from "@/lib/motion/light-breathing";

describe("light-breathing motion tokens", () => {
  it("keeps reveal variants transform-only so content stays visible without JS", () => {
    expect(lightBreathingItemVariants.hidden).toEqual({ y: 12 });
    expect(lightBreathingItemVariants.visible).toEqual({ y: 0 });
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
});
