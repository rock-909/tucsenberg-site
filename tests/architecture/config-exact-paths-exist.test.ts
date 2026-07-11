import fs from "node:fs";
import { describe, expect, it } from "vitest";

const REPO_PATH_PATTERN = /^(?:content|messages|public|scripts|src|tests)\//u;
const QUOTED_REPO_PATH_PATTERN =
  /["']((?:content|messages|public|scripts|src|tests)\/[^"'\n]+)["']/gu;

function isExactRepoPath(candidate: string): boolean {
  return REPO_PATH_PATTERN.test(candidate) && !/[?*{}]/u.test(candidate);
}

function getMissingPaths(paths: Iterable<string>): string[] {
  return (
    [...new Set(paths)]
      .filter(isExactRepoPath)
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test validates repo-local config paths
      .filter((repoPath) => !fs.existsSync(repoPath))
      .sort()
  );
}

function extractQuotedRepoPaths(configPath: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- configPath comes from the fixed test cases below
  const source = fs.readFileSync(configPath, "utf8");
  return [...source.matchAll(QUOTED_REPO_PATH_PATTERN)].map(
    (match) => match[1] ?? "",
  );
}

describe("exact repository paths in configuration", () => {
  it("keeps React Doctor override paths live", () => {
    const config = JSON.parse(
      fs.readFileSync("doctor.config.json", "utf8"),
    ) as {
      ignore?: { overrides?: Array<{ files?: string[] }> };
    };
    const paths =
      config.ignore?.overrides?.flatMap((override) => override.files ?? []) ??
      [];

    expect(getMissingPaths(paths)).toEqual([]);
  });

  it.each(["eslint.config.mjs", "vitest.config.mts"])(
    "keeps exact paths live in %s",
    (configPath) => {
      expect(getMissingPaths(extractQuotedRepoPaths(configPath))).toEqual([]);
    },
  );

  it("keeps exact CODEOWNERS paths live", () => {
    const paths = fs
      .readFileSync(".github/CODEOWNERS", "utf8")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"))
      .map((line) => line.split(/\s+/u)[0]?.replace(/^\//u, "") ?? "");

    expect(getMissingPaths(paths)).toEqual([]);
  });

  it("keeps exact Semgrep exclusions live", () => {
    const paths = fs
      .readFileSync("semgrep.yml", "utf8")
      .split(/\r?\n/u)
      .flatMap((line) => {
        const match = line.match(/^\s*-\s+["']?([^"'#]+?)["']?\s*$/u);
        return match?.[1] ? [match[1].replace(/^\*\*\//u, "")] : [];
      });

    expect(getMissingPaths(paths)).toEqual([]);
  });
});
