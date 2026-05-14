import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CLIENT_ISLAND_MARKERS = [
  "ProductActions",
  "InquiryDrawer",
  "ProductInquiryForm",
] as const;

describe("shipped product routes", () => {
  it("do not import product inquiry client islands directly", () => {
    const combinedSource = [
      readFileSync("src/app/[locale]/products/page.tsx", "utf8"),
      readFileSync("src/app/[locale]/products/[market]/page.tsx", "utf8"),
    ].join("\n");

    for (const marker of CLIENT_ISLAND_MARKERS) {
      expect(combinedSource).not.toContain(marker);
    }
  });
});
