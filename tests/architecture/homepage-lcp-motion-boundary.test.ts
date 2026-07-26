import { existsSync, globSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { SINGLE_SITE_HOME_SECTION_ORDER } from "@/config/single-site-page-expression";
import { lightBreathingItemVariants } from "@/lib/motion/light-breathing";

// Local-wrapper graph enforcement for the motion boundary lives in
// .dependency-cruiser.js ("no-motion-wrapper-outside-home", severity error,
// wired into CI and lefthook). dependency-cruiser excludes node_modules from
// its graph, so direct motion/react and framer-motion imports are guarded by
// the specifier scan below instead.
const FORBIDDEN_MOTION_SPECIFIERS = ["motion/react", "framer-motion"] as const;
// Exact files, not directories: a directory allowlist lets a new file inside
// src/components/motion/ pull the motion runtime in and still ship CI-green.
const ALLOWED_MOTION_FILES: readonly string[] = [
  "src/components/motion/breathing-reveal.tsx",
  "src/components/motion/light-motion-provider.tsx",
  "src/test/setup.base-mocks.ts",
];
const EXCLUDED_FILE_PATTERN = /\.(?:test|spec|stories)\.(?:ts|tsx)$/;
const IMPORT_SPECIFIER_PATTERN =
  /\b(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;

interface DepCruiserPathRule {
  readonly name?: string;
  readonly from?: { readonly path?: string; readonly pathNot?: string };
  readonly to?: { readonly path?: string };
}

function loadMotionWrapperRule(): DepCruiserPathRule {
  const require = createRequire(import.meta.url);
  const config = require("../../.dependency-cruiser.js") as {
    forbidden?: DepCruiserPathRule[];
  };
  const rule = config.forbidden?.find(
    (candidate) => candidate.name === "no-motion-wrapper-outside-home",
  );
  if (!rule) throw new Error("no-motion-wrapper-outside-home rule is missing");
  return rule;
}

function findForbiddenMotionImports(source: string): string[] {
  return [...source.matchAll(IMPORT_SPECIFIER_PATTERN)]
    .map((match) => match[1] ?? "")
    .filter((specifier) =>
      FORBIDDEN_MOTION_SPECIFIERS.some(
        (forbidden) =>
          specifier === forbidden || specifier.startsWith(`${forbidden}/`),
      ),
    );
}

describe("homepage LCP motion boundary", () => {
  it("keeps breathing reveal content visible before client motion activates", () => {
    const hidden: Record<string, unknown> = lightBreathingItemVariants.hidden;

    expect(hidden).not.toHaveProperty("opacity");
    expect(hidden).not.toHaveProperty("visibility");
    expect(hidden).not.toHaveProperty("display");
  });

  it("keeps the hero as the first home section", () => {
    expect(SINGLE_SITE_HOME_SECTION_ORDER[0]).toBe("hero");
  });

  it("keeps motion/react and framer-motion out of non-approved src files", () => {
    const sourceFiles = [
      ...globSync("src/**/*.ts"),
      ...globSync("src/**/*.tsx"),
    ];
    const offenders = sourceFiles
      .filter((file) => !EXCLUDED_FILE_PATTERN.test(file))
      .filter((file) => !ALLOWED_MOTION_FILES.includes(file))
      .flatMap((file) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads files discovered under src
        const source = readFileSync(file, "utf8");
        return findForbiddenMotionImports(source).map(
          (specifier) => `${file} -> ${specifier}`,
        );
      });

    expect(offenders).toEqual([]);
  });

  it("keeps the npm-import allowlist pointing at live files", () => {
    const missing = ALLOWED_MOTION_FILES.filter(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test validates its own repo-local allowlist
      (file) => !existsSync(file),
    );

    expect(missing).toEqual([]);
  });

  // The graph rule catches an indirect edge only through the intermediate
  // module's own direct edge, so the `from` exemption must stay one file wide.
  // A directory-wide exemption reopens the two-hop path
  // 非首页 → src/components/motion/新 facade → breathing-reveal with CI green.
  it("exempts only the home page from the motion wrapper graph rule", () => {
    const rule = loadMotionWrapperRule();
    /* eslint-disable security/detect-non-literal-regexp -- the patterns come from the repo's own dep-cruiser config; compiling them is the point of this test */
    const fromPath = new RegExp(rule.from?.path ?? "", "u");
    const fromPathNot = new RegExp(rule.from?.pathNot ?? "$^", "u");
    const toPath = new RegExp(rule.to?.path ?? "", "u");
    /* eslint-enable security/detect-non-literal-regexp -- scope ends with the three config patterns above */
    const isGuardedSource = (file: string): boolean =>
      fromPath.test(file) && !fromPathNot.test(file);

    expect(isGuardedSource("src/app/[locale]/page.tsx")).toBe(false);
    expect(isGuardedSource("src/components/motion/facade.tsx")).toBe(true);
    expect(isGuardedSource("src/lib/motion/facade.ts")).toBe(true);
    expect(isGuardedSource("src/app/[locale]/products/page.tsx")).toBe(true);
    expect(toPath.test("src/components/motion/breathing-reveal.tsx")).toBe(
      true,
    );
    expect(toPath.test("src/components/motion/light-motion-provider.tsx")).toBe(
      true,
    );
    expect(toPath.test("src/components/motion/page-transition.tsx")).toBe(
      false,
    );
  });

  it("detects forbidden motion specifiers (parser self-check)", () => {
    expect(
      findForbiddenMotionImports('import { motion } from "motion/react";\n'),
    ).toEqual(["motion/react"]);
    expect(
      findForbiddenMotionImports('const m = await import("framer-motion");\n'),
    ).toEqual(["framer-motion"]);
  });
});
