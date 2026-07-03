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

  it("reads showcase-full fixtures through explicit profile helper", () => {
    const entry = getProfileFixtureContentEntry(
      "showcase-full",
      "pages",
      "en",
      "capabilities",
    );

    expect(entry?.source).toBe("profile-fixture");
    expect(entry?.profileId).toBe("showcase-full");
    expect(entry?.relativePath).toBe(
      "profile-fixtures/showcase-full/content/pages/en/capabilities.mdx",
    );
  });

  it("resolves optional showcase-full content after active lookup misses", () => {
    expect(resolveOptionalContentEntry("pages", "en", "about")?.source).toBe(
      "active-content",
    );
    expect(
      resolveOptionalContentEntry("pages", "en", "capabilities")?.source,
    ).toBe("profile-fixture");
  });
});
