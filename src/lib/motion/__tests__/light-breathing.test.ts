import { describe, expect, it } from "vitest";

import {
  getInstantTransition,
  lightBreathingPageEnterTransition,
  lightBreathingRevealTransition,
  lightBreathingStaggerChildren,
  lightBreathingViewport,
} from "@/lib/motion/light-breathing";

describe("light-breathing motion tokens", () => {
  it("keeps stagger intervals short for the restrained tier", () => {
    expect(lightBreathingStaggerChildren).toBeLessThanOrEqual(0.1);
  });

  it("keeps page transitions faster than section reveals", () => {
    expect(lightBreathingPageEnterTransition.duration).toBeLessThan(
      lightBreathingRevealTransition.duration,
    );
    expect(lightBreathingPageEnterTransition.exit.duration).toBeLessThan(
      lightBreathingPageEnterTransition.duration,
    );
  });

  it("uses the first-pass scroll reveal timing", () => {
    expect(lightBreathingViewport.amount).toBe(0.15);
    expect(lightBreathingViewport.margin).toBe("-8% 0px -8% 0px");
  });

  it("returns instant transitions when reduced motion is enabled", () => {
    expect(getInstantTransition(true)).toEqual({ duration: 0 });
  });
});
