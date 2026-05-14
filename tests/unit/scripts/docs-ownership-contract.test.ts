import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo documentation files
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function countHeading(content: string, pattern: RegExp): number {
  return content.split(/\r?\n/u).filter((line) => pattern.test(line.trim()))
    .length;
}

function extractFencedCodeBlocks(content: string): string[] {
  return Array.from(content.matchAll(/```[\s\S]*?```/gu)).map(
    (match) => match[0],
  );
}

describe("documentation ownership contract", () => {
  it("keeps a docs ownership map for bilingual and technical doc boundaries", () => {
    const ownershipMap = readRepoFile("docs/guides/DOCS-OWNERSHIP-MAP.md");
    const policyIndex = readRepoFile("docs/guides/POLICY-SOURCE-OF-TRUTH.md");
    const docsReadme = readRepoFile("docs/README.md");

    for (const expected of [
      "docs/website/**",
      "docs/guides/**",
      "docs/technical/**",
      "Chinese owner-facing operation entry",
      "English technical and governance reference",
      "Do not copy full checklists across languages",
    ]) {
      expect(ownershipMap).toContain(expected);
    }

    expect(policyIndex).toContain("DOCS-OWNERSHIP-MAP.md");
    expect(docsReadme).toContain("DOCS-OWNERSHIP-MAP.md");
  });

  it("keeps the English derivative checklist as an index instead of a second full replacement list", () => {
    const englishChecklist = readRepoFile(
      "docs/guides/DERIVATIVE-PROJECT-REPLACEMENT-CHECKLIST.md",
    );

    expect(englishChecklist).toContain("docs/website/新项目替换清单.md");
    expect(englishChecklist).toContain("docs/website/配置真相源.md");
    expect(englishChecklist).toContain(
      "docs/guides/CANONICAL-TRUTH-REGISTRY.md",
    );
    expect(englishChecklist).toContain(
      "does not own the step-by-step replacement order",
    );
    expect(englishChecklist).toContain(
      "The Chinese website checklist owns the replacement sequence",
    );
    expect(englishChecklist).toContain("ownership");
    expect(countHeading(englishChecklist, /^### Step \d+:/u)).toBe(0);
    expect(englishChecklist).not.toMatch(/\bStep\s+1\b/u);
    expect(englishChecklist).not.toMatch(/^#{1,6}\s+Replacement order\b/mu);
    expect(englishChecklist).not.toMatch(/^#{1,6}\s+Replacement sequence\b/mu);
    expect(englishChecklist).not.toContain(
      "## Replacement order (do not reorder)",
    );
    expect(extractFencedCodeBlocks(englishChecklist)).toEqual([]);
  });
});
