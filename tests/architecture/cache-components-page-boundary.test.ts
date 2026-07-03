import { describe, expect, it } from "vitest";

import { existsSync, readFileSync } from "node:fs";

const SHARED_STATIC_MDX_ROUTE_SOURCES = [
  {
    routeOwner: "src/app/[locale]/about/page.tsx",
    source: readFileSync("src/app/[locale]/about/page.tsx", "utf8"),
  },
  {
    routeOwner: "src/app/[locale]/oem-wholesale/page.tsx",
    source: readFileSync("src/app/[locale]/oem-wholesale/page.tsx", "utf8"),
  },
  {
    routeOwner:
      "src/app/[locale]/guides/flood-barrier-materials-guide/page.tsx",
    source: readFileSync(
      "src/app/[locale]/guides/flood-barrier-materials-guide/page.tsx",
      "utf8",
    ),
  },
  {
    routeOwner: "src/app/[locale]/guides/flood-barrier-specifications/page.tsx",
    source: readFileSync(
      "src/app/[locale]/guides/flood-barrier-specifications/page.tsx",
      "utf8",
    ),
  },
  {
    routeOwner: "src/app/[locale]/warranty/page.tsx",
    source: readFileSync("src/app/[locale]/warranty/page.tsx", "utf8"),
  },
] as const;

const LEGAL_ROUTE_SOURCES = [
  {
    routeOwner: "src/app/[locale]/privacy/page.tsx",
    source: readFileSync("src/app/[locale]/privacy/page.tsx", "utf8"),
  },
  {
    routeOwner: "src/app/[locale]/terms/page.tsx",
    source: readFileSync("src/app/[locale]/terms/page.tsx", "utf8"),
  },
] as const;

describe("Cache Components page boundaries", () => {
  it("keeps ops routes on their own root layout outside localized pages", () => {
    const source = readFileSync("src/app/ops/layout.tsx", "utf8");

    expect(source).toContain('import "@/app/globals.css";');
    expect(source).toContain("<html");
    expect(source).toContain("<body");
    expect(source).not.toContain("@/components/layout/header");
    expect(source).not.toContain("@/components/footer");
  });

  it("keeps retired showcase demo pages out of the Tucsenberg route tree", () => {
    expect(existsSync("src/app/[locale]/capabilities/page.tsx")).toBe(false);
    expect(existsSync("src/app/[locale]/how-it-works/page.tsx")).toBe(false);
    expect(existsSync("src/app/[locale]/custom-project-support/page.tsx")).toBe(
      false,
    );
  });

  it("keeps target MDX pages routed through the shared static page shell", () => {
    for (const { routeOwner, source } of SHARED_STATIC_MDX_ROUTE_SOURCES) {
      expect(source, routeOwner).toContain("generateStaticMdxPageMetadata");
      expect(source, routeOwner).toContain("StaticMdxPage");
    }
  });

  it("keeps specialized legal pages behind their route-local Suspense boundary", () => {
    for (const { routeOwner, source } of LEGAL_ROUTE_SOURCES) {
      expect(source, routeOwner).toContain('import { Suspense } from "react";');
      expect(source, routeOwner).toContain("<Suspense");
      expect(source, routeOwner).toContain("LegalPageShell");
    }
  });
});
