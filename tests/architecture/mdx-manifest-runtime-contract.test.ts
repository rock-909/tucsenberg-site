import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const RUNTIME_FILES = [
  "src/lib/content-manifest.ts",
  "src/lib/content-query/queries.ts",
  "src/lib/content/page-dates.ts",
  "src/lib/mdx-loader.ts",
] as const;

const FORBIDDEN_RUNTIME_IMPORTS = [
  "node:fs",
  "fs",
  "node:path",
  "path",
  "gray-matter",
  "glob",
  "fast-glob",
  "@/lib/content-parser",
  "@/lib/content-utils",
] as const;

function readSource(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local runtime files from the allowlist above
  return readFileSync(relativePath, "utf8");
}

describe("MDX manifest-only runtime contract", () => {
  it("keeps runtime content loading free of filesystem and parser imports", () => {
    for (const file of RUNTIME_FILES) {
      const source = readSource(file);

      for (const forbidden of FORBIDDEN_RUNTIME_IMPORTS) {
        expect(source).not.toContain(`from "${forbidden}"`);
        expect(source).not.toContain(`from '${forbidden}'`);
        expect(source).not.toContain(`require("${forbidden}")`);
        expect(source).not.toContain(`require('${forbidden}')`);
      }
    }
  });

  it("loads runtime manifest and MDX components from generated artifacts", () => {
    expect(readSource("src/lib/content-manifest.ts")).toContain(
      "./content-manifest.generated",
    );
    expect(readSource("src/lib/content-query/queries.ts")).toContain(
      "@/lib/content-manifest",
    );
    expect(readSource("src/lib/content/page-dates.ts")).toContain(
      "@/lib/content-manifest",
    );
    expect(readSource("src/lib/mdx-loader.ts")).toContain(
      "@/lib/mdx-importers.generated",
    );
  });

  it("keeps the generated manifest catalog-only", () => {
    for (const file of [
      "src/lib/content-manifest.ts",
      "src/lib/content-manifest.generated.ts",
      "scripts/quality/checks/content-manifest.js",
    ]) {
      const source = readSource(file);
      expect(source).not.toContain("profile-fixture");
      expect(source).not.toContain("showcase-full");
    }
  });

  it("does not ship retired showcase-full fixture MDX imports in the materialized site", () => {
    const source = readSource("src/lib/mdx-importers.generated.ts");
    expect(source).not.toContain(
      "../../profile-fixtures/showcase-full/content/pages/en/capabilities.mdx",
    );
    expect(source).not.toMatch(
      /@content\/pages\/(?:en|zh)\/(?:capabilities|how-it-works|custom-project-support)\.mdx/u,
    );
  });
});
