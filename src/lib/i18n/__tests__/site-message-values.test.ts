import { afterEach, describe, expect, it, vi } from "vitest";

const CHECKED_IN_SITE_YEAR = "2026";

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
});

describe("site message values", () => {
  it("derives prerender-safe values from checked-in site facts, not the current clock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2035-01-01T00:00:00.000Z"));

    const { getSiteMessageValues } =
      await import("@/lib/i18n/site-message-values");

    const values = getSiteMessageValues();

    expect(values.currentYear).toBe(CHECKED_IN_SITE_YEAR);
    expect(values.copyright.en).toContain(`(c) ${CHECKED_IN_SITE_YEAR}`);
    expect(values.copyright.zh).toContain(`(c) ${CHECKED_IN_SITE_YEAR}`);
  });
});
