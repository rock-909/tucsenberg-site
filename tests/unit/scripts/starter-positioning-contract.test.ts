import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("Tucsenberg positioning contract", () => {
  it("preserves core surfaces unless a separate migration plan exists", () => {
    const readme = readRepoFile("docs/website/README.md");
    const replacement = readRepoFile("docs/website/新项目替换清单.md");
    const decision = readRepoFile(
      "docs/website/starter-positioning-decision.md",
    );

    expect(readme).toContain("starter-positioning-decision.md");
    expect(decision).toContain("High-config showcase starter");
    expect(decision).toContain("Minimal core plus optional presets");
    expect(decision).toContain("Current decision");
    expect(replacement).toContain(
      "Do not delete products, ops, Storybook, or governance tests just to make the repo look smaller. Scope reduction requires a separate migration plan.",
    );
  });
});
