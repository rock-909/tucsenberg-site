import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Bundle boundary: the home hero search is an above-the-fold client island
 * statically imported by the home page Server Component. It must NOT pull the
 * Zod-validated compatibility data layer (or anything that transitively runs
 * `zod.parse()` at module load) into the home page client bundle.
 *
 * The pure matcher module (`search-match.ts`) is the only data-layer module a
 * client component may import, and it must itself stay Zod-free.
 */

const REPO_ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local source files from explicit call sites
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

const HERO_SEARCH = "src/components/search/home-hero-search.tsx";
const PURE_MATCHER = "src/data/product-compatibility/search-match.ts";

const FORBIDDEN_IN_CLIENT = [
  '@/data/product-compatibility"',
  "@/data/product-compatibility/indexes",
  "@/data/product-compatibility/catalog",
  "@/data/product-compatibility/mappings",
  "@/data/product-compatibility/product-slug",
  "@/data/product-compatibility/schemas",
  "@/data/product-compatibility/search-index",
  '"zod"',
  "from 'zod'",
];

describe("home hero search bundle boundary", () => {
  const heroSource = readRepoFile(HERO_SEARCH);

  it("does not import the Zod-validated compatibility data barrel or layer", () => {
    for (const forbidden of FORBIDDEN_IN_CLIENT) {
      expect(
        heroSource.includes(forbidden),
        `home-hero-search.tsx must not import ${forbidden}`,
      ).toBe(false);
    }
  });

  it("imports only the pure matcher from the data folder", () => {
    expect(heroSource).toContain("@/data/product-compatibility/search-match");
  });

  it("keeps the pure matcher itself Zod-free and free of data-layer values", () => {
    const matcherSource = readRepoFile(PURE_MATCHER);

    expect(matcherSource).not.toContain('from "zod"');
    expect(matcherSource).not.toContain("from 'zod'");
    // No data-layer value import. Type-only imports/exports
    // (`import type` / `export type`) are erased at compile time and never
    // enter the client bundle, so they are allowed; a value `import { ... }
    // from "@/data/product-compatibility..."` is not.
    const valueImportLines = matcherSource
      .split("\n")
      .filter(
        (line) =>
          /^\s*(import|export)\b/.test(line) &&
          line.includes("@/data/product-compatibility") &&
          !/^\s*(import|export)\s+type\b/.test(line),
      );

    expect(
      valueImportLines,
      `pure matcher must only use type-only data-layer imports, found: ${valueImportLines.join(
        " | ",
      )}`,
    ).toEqual([]);

    // Belt-and-braces: never the catalog/mappings/search-index data modules at
    // all (not even type-only — they would risk a value import slip).
    for (const forbidden of [
      "@/data/product-compatibility/catalog",
      "@/data/product-compatibility/mappings",
      "@/data/product-compatibility/search-index",
    ]) {
      expect(matcherSource).not.toContain(forbidden);
    }
  });
});
