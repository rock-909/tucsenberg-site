import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../..");

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo config files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("Vitest MDX alias contract", () => {
  it("replaces the whole MDX import id so vitest related works in worktrees", () => {
    const config = readRepoFile("vitest.config.mts");

    expect(config).toContain("find: /^.*\\.mdx$/u");
    expect(config).not.toContain("find: /\\.mdx$/");
  });
});
