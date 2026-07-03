import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STARTER_PROFILES } from "@/config/starter-profiles";

describe("retired blog archive list item", () => {
  it("keeps the active Tucsenberg catalog site free of the old blog archive item", () => {
    expect(
      existsSync(
        join(process.cwd(), "src/components/content/blog-archive-list-item.tsx"),
      ),
    ).toBe(false);
    expect(STARTER_PROFILES.catalog.staticPages).not.toContain("blog");
    expect(STARTER_PROFILES.catalog.dynamicSurfaces).not.toContain(
      "blogArticle",
    );
  });
});
