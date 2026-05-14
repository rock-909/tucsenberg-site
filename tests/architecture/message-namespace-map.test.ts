import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MESSAGE_MAP_DOC = "docs/website/message-namespace-map.md";

describe("message namespace map", () => {
  it("documents every current top-level message namespace", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");
    const criticalMessages = JSON.parse(
      readFileSync("messages/en/critical.json", "utf8"),
    ) as Record<string, unknown>;
    const deferredMessages = JSON.parse(
      readFileSync("messages/en/deferred.json", "utf8"),
    ) as Record<string, unknown>;
    const criticalNamespaces = Object.keys(criticalMessages);
    const deferredNamespaces = Object.keys(deferredMessages);

    expect(doc).toContain("messages/{locale}/critical.json");
    expect(doc).toContain("messages/{locale}/deferred.json");

    for (const namespace of [...criticalNamespaces, ...deferredNamespaces]) {
      expect(doc).toContain(`\`${namespace}\``);
    }
  });

  it("keeps adopter-facing categories and proof command visible", () => {
    const doc = readFileSync(MESSAGE_MAP_DOC, "utf8");
    const replacementIndex = readFileSync(
      "docs/website/replacement-surface-index.md",
      "utf8",
    );

    expect(doc).toContain("must-replace");
    expect(doc).toContain("review-or-tune");
    expect(doc).toContain("do-not-edit-first");
    expect(doc).toContain("node scripts/starter-checks.js translations");
    expect(replacementIndex).toContain("message-namespace-map.md");
  });
});
