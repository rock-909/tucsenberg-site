import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { PageType } from "@/config/paths";
import {
  PUBLIC_STATIC_PAGE_DEFINITIONS,
  PUBLIC_STATIC_PAGE_TYPES,
} from "@/config/pages.config";

const REPO_ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local docs from explicit call sites
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

function expectStaticRouteOwner(routeOwner: string): void {
  expect(routeOwner.startsWith("src/app/[locale]/")).toBe(true);
  expect(routeOwner.endsWith("page.tsx")).toBe(true);

  const relativePath = routeOwner.slice("src/app/[locale]/".length);
  const segments = relativePath.split("/");
  expect(segments.at(-1)).toBe("page.tsx");

  const routeSegments = segments.slice(0, -1);
  const allowedCharacters = "abcdefghijklmnopqrstuvwxyz0123456789-";
  for (const segment of routeSegments) {
    expect(segment.length).toBeGreaterThan(0);
    for (const character of segment) {
      expect(allowedCharacters).toContain(character);
    }
  }
}

describe("static public pages architecture contract", () => {
  it("keeps pages.config.ts as the static public pages truth source", () => {
    const docs = [
      readRepoFile("docs/项目基础/替换顺序.md"),
      readRepoFile("docs/项目基础/内容.md"),
    ].join("\n");

    expect(docs).toContain("src/config/pages.config.ts");
    expect(docs).toContain("static public pages");
    expect(docs).toContain("content/pages/{locale}");
    expect(docs).toContain("messages/{locale}");
  });

  it("does not include dynamic route page types in the first registry", () => {
    const disallowed = ["productMarket", "blogArticle"] as const;
    const actual = PUBLIC_STATIC_PAGE_TYPES as readonly string[];

    for (const pageType of disallowed) {
      expect(actual).not.toContain(pageType);
    }
  });

  it("keeps route owners static, literal, and backed by real files", () => {
    for (const definition of PUBLIC_STATIC_PAGE_DEFINITIONS) {
      expectStaticRouteOwner(definition.routeOwner);
      expect(definition.routeOwner).not.toContain("[market]");
      expect(definition.routeOwner).not.toContain("[slug]");
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test checks fixed repo-local routeOwner paths from the registry contract
      expect(existsSync(join(REPO_ROOT, definition.routeOwner))).toBe(true);
    }
  });

  it("keeps the current PageType set represented by the registry", () => {
    const expected = [
      "home",
      "products",
      "oemWholesale",
      "materialsGuide",
      "specificationsGuide",
      "about",
      "requestQuote",
      "contact",
      "warranty",
      "privacy",
      "terms",
    ] as const satisfies readonly PageType[];

    expect(PUBLIC_STATIC_PAGE_TYPES).toEqual(expected);
  });
});
