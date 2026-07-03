import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../..");

const fixtureImportPatterns = [
  /\bfrom\s*["'][^"']*homepage-section\.fixtures["']/u,
  /\bfrom\s*["'][^"']*section-story-fixtures["']/u,
  /import\(["'][^"']*homepage-section\.fixtures["']\)/u,
  /import\(["'][^"']*section-story-fixtures["']\)/u,
] as const;

const allowedImportPathPatterns = [
  /\.test\.[cm]?[jt]sx?$/u,
  /\.stories\.[cm]?[jt]sx?$/u,
  /src\/components\/sections\/homepage-section\.fixtures\.ts$/u,
  /src\/components\/sections\/section-story-fixtures\.ts$/u,
] as const;

const storyImportPattern = /(?:from|import\()\s*["'][^"']*\.stories["']/u;

// Storybook is an owner-visible review surface; these motifs would push the old
// generic-demo / developer-platform direction back into review.
const bannedStoryMotifPattern = /vercel|geist|developer platform|ai workflow/iu;

const ownerVisibleStoryRoots = [
  "src/components/sections",
  "src/components/footer",
  "src/components/layout",
] as const;

// Pure-Node scan (no external `rg` dependency, which is not installed on every
// runner): a missing source root throws ENOENT and fails the test closed,
// instead of silently passing the boundary check.
function listSourceFiles(roots: readonly string[]): readonly string[] {
  const files: string[] = [];

  for (const root of roots) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed architecture-test roots
    const entries = readdirSync(path.join(REPO_ROOT, root), {
      recursive: true,
    }) as string[];

    for (const entry of entries) {
      const relativePath = `${root}/${entry.split(path.sep).join("/")}`;

      if (/\.[cm]?[jt]sx?$/u.test(relativePath)) {
        files.push(relativePath);
      }
    }
  }

  return files;
}

function readSource(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed architecture-test paths
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function filesMatching(
  roots: readonly string[],
  pattern: RegExp,
): readonly string[] {
  return listSourceFiles(roots).filter((file) =>
    pattern.test(readSource(file)),
  );
}

describe("Storybook fixture runtime boundary", () => {
  it("keeps section fixture modules out of runtime page and component imports", () => {
    const offenders = fixtureImportPatterns.flatMap((pattern) =>
      filesMatching(["src", "tests"], pattern).filter(
        (filePath) =>
          !allowedImportPathPatterns.some((allowedPattern) =>
            allowedPattern.test(filePath),
          ),
      ),
    );

    expect(offenders).toStrictEqual([]);
  });

  it("keeps runtime code from importing Storybook stories, even indirectly via a story barrel", () => {
    const offenders = filesMatching(["src"], storyImportPattern).filter(
      (filePath) =>
        !/\.test\.[cm]?[jt]sx?$/u.test(filePath) &&
        !/\.stories\.[cm]?[jt]sx?$/u.test(filePath),
    );

    expect(offenders).toStrictEqual([]);
  });

  it("keeps owner-visible stories free of Vercel/developer-platform motifs", () => {
    const offenders = listSourceFiles(ownerVisibleStoryRoots).filter(
      (filePath) =>
        /\.stories\.[cm]?[jt]sx?$/u.test(filePath) &&
        bannedStoryMotifPattern.test(readSource(filePath)),
    );

    expect(offenders).toStrictEqual([]);
  });
});
