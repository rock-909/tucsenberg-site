import { describe, expect, it } from "vitest";
import {
  getContentEntry,
  getProfileFixtureContentEntry,
  resolveOptionalContentEntry,
} from "@/lib/content-manifest";

describe("content manifest profile/source boundaries", () => {
  it("returns active content only from getContentEntry by default", () => {
    expect(getContentEntry("pages", "en", "about")?.source).toBe(
      "active-content",
    );
    expect(getContentEntry("pages", "en", "capabilities")).toBeUndefined();
  });

  it("does not expose retired showcase-full fixtures through the explicit helper", () => {
    const entry = getProfileFixtureContentEntry(
      "showcase-full",
      "pages",
      "en",
      "capabilities",
    );

    expect(entry).toBeUndefined();
  });

  it("does not resolve retired optional showcase-full content after active lookup misses", () => {
    expect(resolveOptionalContentEntry("pages", "en", "about")?.source).toBe(
      "active-content",
    );
    expect(
      resolveOptionalContentEntry("pages", "en", "capabilities")?.source,
    ).toBeUndefined();
  });
});
