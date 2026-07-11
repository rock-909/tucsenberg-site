import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getActiveStaticPageTypes } from "@/config/pages.config";

describe("retired blog archive list item", () => {
  it("keeps the active Tucsenberg catalog site free of the old blog archive item", () => {
    expect(
      existsSync(
        join(process.cwd(), "src/components/content/blog-archive-list-item.tsx"),
      ),
    ).toBe(false);
    expect(getActiveStaticPageTypes()).not.toContain("blog");
  });
});
