import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

describe("Cache Components page boundaries", () => {
  it("keeps ops routes on their own root layout outside localized pages", () => {
    const source = readFileSync("src/app/ops/layout.tsx", "utf8");

    expect(source).toContain('import "@/app/globals.css";');
    expect(source).toContain("<html");
    expect(source).toContain("<body");
    expect(source).not.toContain("@/components/layout/header");
    expect(source).not.toContain("@/components/footer");
  });

  it("keeps capabilities MDX loading behind Suspense", () => {
    const source = readFileSync(
      "src/app/[locale]/capabilities/page.tsx",
      "utf8",
    );

    expect(source).toContain('import { Suspense } from "react";');
    expect(source).toContain("<Suspense");
    expect(source).toContain("LoadingSkeleton");
  });

  it("keeps how-it-works MDX loading behind Suspense", () => {
    const source = readFileSync(
      "src/app/[locale]/how-it-works/page.tsx",
      "utf8",
    );

    expect(source).toContain('import { Suspense } from "react";');
    expect(source).toContain("<Suspense");
    expect(source).toContain("LoadingSkeleton");
  });
});
