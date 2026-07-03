import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STARTER_PROFILES } from "@/config/starter-profiles";

describe("retired ResourcesSection wrapper", () => {
  it("keeps the active homepage free of the old resources section wrapper", () => {
    const homepageSource = readFileSync("src/app/[locale]/page.tsx", "utf8");

    expect(
      existsSync(join(process.cwd(), "src/components/sections/resources-section.tsx")),
    ).toBe(false);
    expect(homepageSource).not.toContain("ResourcesSection");
    expect(STARTER_PROFILES.catalog.staticPages).not.toContain("resources");
  });
});
