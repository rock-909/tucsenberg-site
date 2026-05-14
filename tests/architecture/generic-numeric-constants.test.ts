import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CLEANUP_FILES = [
  "src/app/[locale]/contact/page.tsx",
  "src/lib/seo/url-generator.ts",
  "src/i18n/request.ts",
  "src/lib/lead-pipeline/utils.ts",
];

const TSX_CLEANUP_FILES = CLEANUP_FILES.filter((file) => file.endsWith(".tsx"));

function read(repoPath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads repo-local files from a fixed allowlist
  return readFileSync(repoPath, "utf8");
}

function constantsImportBlocks(source: string) {
  return Array.from(
    source.matchAll(
      /import\s+(?:\{[\s\S]*?\}|[\w*\s{},]+)\s+from\s+["']@\/constants["'];?/g,
    ),
    (match) => match[0],
  );
}

describe("generic numeric constants cleanup", () => {
  it("keeps scoped production files from importing ZERO or ONE", () => {
    const offenders = CLEANUP_FILES.flatMap((file) =>
      constantsImportBlocks(read(file))
        .filter((block) => /\b(?:ZERO|ONE)\b/.test(block))
        .map((block) => ({ file, block })),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps scoped TSX files from using global COUNT_TWO", () => {
    const offenders = TSX_CLEANUP_FILES.filter((file) =>
      /\bCOUNT_TWO\b/.test(read(file)),
    );

    expect(offenders).toEqual([]);
  });
});
