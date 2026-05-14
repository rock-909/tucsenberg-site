import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("messages split feasibility boundary", () => {
  it("records the runtime impact before any physical message split", () => {
    const feasibility = readFileSync(
      "docs/website/messages-split-feasibility.md",
      "utf8",
    );
    const i18nSettings = readFileSync("docs/website/i18n设置.md", "utf8");

    expect(feasibility).toContain("do not split now");
    expect(feasibility).toContain("src/lib/i18n/load-messages.ts");
    expect(feasibility).toContain("src/lib/i18n/static-split-messages.ts");
    expect(feasibility).toContain("src/i18n/request.ts");
    expect(feasibility).toContain("src/types/next-intl.d.ts");
    expect(feasibility).toContain("scripts/quality/checks/translations.js");
    expect(feasibility).toContain("message-namespace-map.md");
    expect(feasibility).toContain(
      "node scripts/starter-checks.js translations",
    );
    expect(feasibility).toContain("pnpm content:check");
    expect(feasibility).toContain("pnpm type-check");
    expect(i18nSettings).toContain("messages-split-feasibility.md");
  });

  it("keeps the current runtime contract on critical and deferred files", () => {
    const loadMessages = readFileSync("src/lib/i18n/load-messages.ts", "utf8");
    const staticSplitMessages = readFileSync(
      "src/lib/i18n/static-split-messages.ts",
      "utf8",
    );

    expect(loadMessages).toContain("@messages/en/critical.json");
    expect(loadMessages).toContain("@messages/en/deferred.json");
    expect(loadMessages).toContain("@messages/zh/critical.json");
    expect(loadMessages).toContain("@messages/zh/deferred.json");
    expect(staticSplitMessages).toContain("@messages/en/critical.json");
    expect(staticSplitMessages).toContain("@messages/en/deferred.json");
    expect(staticSplitMessages).toContain("@messages/zh/critical.json");
    expect(staticSplitMessages).toContain("@messages/zh/deferred.json");
  });
});
