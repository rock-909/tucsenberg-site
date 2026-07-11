import { describe, expect, it } from "vitest";
import { resolveOptionalContentEntry } from "@/lib/content-manifest";

describe("content manifest profile/source boundaries", () => {
  it("resolves active source-checkout content", () => {
    expect(resolveOptionalContentEntry("pages", "en", "about")?.source).toBe(
      "active-content",
    );
  });

  it("does not resolve retired optional showcase-full content", () => {
    expect(
      resolveOptionalContentEntry("pages", "en", "capabilities"),
    ).toBeUndefined();
  });
});
