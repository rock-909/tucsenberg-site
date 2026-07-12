import { describe, expect, it } from "vitest";

import { I18N_MESSAGE_REVALIDATE_SECONDS } from "@/lib/i18n/load-messages";

describe("i18n message cache revalidate unit", () => {
  it("expresses the revalidate window in seconds, not milliseconds", () => {
    // next/cache unstable_cache `revalidate` is in SECONDS. 30 minutes = 1800s.
    expect(I18N_MESSAGE_REVALIDATE_SECONDS).toBe(30 * 60);
  });

  it("stays a sane cache window, guarding the millisecond-as-seconds bug", () => {
    // The retired bug borrowed MONITORING_INTERVALS.CACHE_CLEANUP (1,800,000 ms),
    // which as seconds is ~20.8 days. A revalidate under one day proves the unit.
    expect(I18N_MESSAGE_REVALIDATE_SECONDS).toBeLessThan(24 * 60 * 60);
  });
});
