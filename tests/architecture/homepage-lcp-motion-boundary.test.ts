import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SINGLE_SITE_HOME_SECTION_ORDER } from "@/config/single-site-page-expression";
import { lightBreathingItemVariants } from "@/lib/motion/light-breathing";

// Local-wrapper graph enforcement for the motion boundary lives in
// .dependency-cruiser.js ("no-motion-wrapper-outside-home", severity error,
// wired into CI and lefthook). dependency-cruiser excludes node_modules from
// its graph, so direct motion/react and framer-motion imports are guarded by
// the specifier scan below instead.
const FORBIDDEN_MOTION_SPECIFIERS = ["motion/react", "framer-motion"] as const;
const ALLOWED_MOTION_PREFIXES = [
  "src/app/[locale]/page.tsx",
  "src/components/motion/",
  "src/lib/motion/",
  "src/test/",
] as const;
const EXCLUDED_FILE_PATTERN = /\.(?:test|spec|stories)\.(?:ts|tsx)$/;
const IMPORT_SPECIFIER_PATTERN =
  /\b(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;

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
      .filter(
        (file) =>
          !ALLOWED_MOTION_PREFIXES.some((prefix) => file.startsWith(prefix)),
      )
      .flatMap((file) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads files discovered under src
        const source = readFileSync(file, "utf8");
        return findForbiddenMotionImports(source).map(
          (specifier) => `${file} -> ${specifier}`,
        );
      });

    expect(offenders).toEqual([]);
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
