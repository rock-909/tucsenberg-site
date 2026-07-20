import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const requireModule = createRequire(import.meta.url);

interface ReconciliationResult {
  isClean: boolean;
  diagnostics: Array<{
    filePath: string;
    line: number;
    ruleId: string;
  }>;
  problems: string[];
  unknownRuleIds: string[];
  unverifiedRuleIds: string[];
}

const { evaluateReconciliation } = requireModule(
  "../../../scripts/react-doctor-reconcile.js",
) as {
  evaluateReconciliation(input: {
    config: unknown;
    report: unknown;
    rules: unknown;
  }): ReconciliationResult;
};

function createReport(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 3,
    version: "0.8.1",
    mode: "full",
    ok: true,
    diagnostics: [],
    summary: { totalDiagnosticCount: 0 },
    projects: [
      {
        complete: true,
        skippedChecks: [],
        skippedCheckReasons: {},
      },
    ],
    ...overrides,
  };
}

const rules = [{ key: "react-doctor/example-rule" }];
const config = {
  ignore: {
    overrides: [
      {
        files: ["src/example.tsx"],
        rules: ["react-doctor/example-rule"],
      },
    ],
  },
};

describe("React Doctor reconciliation", () => {
  it("accepts a complete zero-diagnostic report with known override rules", () => {
    const result = evaluateReconciliation({
      report: createReport(),
      rules,
      config,
    });

    expect(result).toEqual({
      isClean: true,
      diagnostics: [],
      problems: [],
      unknownRuleIds: [],
      unverifiedRuleIds: [],
    });
  });

  it("reports full-scan diagnostics with their rule and source location", () => {
    const diagnostic = {
      plugin: "react-doctor",
      rule: "new-warning",
      normalizedFilePath: "src/example.tsx",
      filePath: "/repo/src/example.tsx",
      line: 12,
    };
    const result = evaluateReconciliation({
      report: createReport({
        diagnostics: [diagnostic],
        summary: { totalDiagnosticCount: 1 },
      }),
      rules,
      config,
    });

    expect(result.isClean).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        filePath: "src/example.tsx",
        line: 12,
        ruleId: "react-doctor/new-warning",
      },
    ]);
  });

  it("reports override rule IDs missing from the scanned React Doctor version", () => {
    const result = evaluateReconciliation({
      report: createReport(),
      rules,
      config: {
        ignore: {
          overrides: [
            {
              files: ["src/example.tsx"],
              rules: ["react-doctor/removed-rule"],
            },
          ],
        },
      },
    });

    expect(result.isClean).toBe(false);
    expect(result.unknownRuleIds).toEqual(["react-doctor/removed-rule"]);
  });

  it("leaves dead-code diagnostic namespaces to the zero-report guard", () => {
    const result = evaluateReconciliation({
      report: createReport(),
      rules,
      config: {
        ignore: {
          overrides: [
            {
              files: ["package.json"],
              rules: ["deslop/unused-dev-dependency"],
            },
          ],
        },
      },
    });

    expect(result.isClean).toBe(true);
    expect(result.unknownRuleIds).toEqual([]);
    expect(result.unverifiedRuleIds).toEqual(["deslop/unused-dev-dependency"]);
  });

  it("rejects uncatalogued legacy lint namespaces", () => {
    const result = evaluateReconciliation({
      report: createReport(),
      rules,
      config: {
        ignore: {
          overrides: [
            {
              files: ["src/example.tsx"],
              rules: ["effect/no-event-handler"],
            },
          ],
        },
      },
    });

    expect(result.isClean).toBe(false);
    expect(result.unknownRuleIds).toEqual(["effect/no-event-handler"]);
    expect(result.unverifiedRuleIds).toEqual([]);
  });

  it.each([
    ["failed report", { ok: false }, "report.ok is not true"],
    ["wrong mode", { mode: "diff" }, 'report.mode must be "full"'],
    ["unknown schema", { schemaVersion: 4 }, "unsupported schemaVersion: 4"],
    [
      "incomplete project",
      { projects: [{ complete: false, skippedChecks: [] }] },
      "project 1 is incomplete",
    ],
    [
      "skipped check",
      {
        projects: [
          {
            complete: true,
            skippedChecks: ["dead-code"],
            skippedCheckReasons: { "dead-code": "failed" },
          },
        ],
      },
      "project 1 skipped checks",
    ],
    [
      "count mismatch",
      {
        diagnostics: [
          {
            plugin: "react-doctor",
            rule: "new-warning",
            filePath: "src/example.tsx",
            line: 1,
          },
        ],
        summary: { totalDiagnosticCount: 0 },
      },
      "diagnostic count mismatch",
    ],
  ])("fails closed for a %s", (_name, reportOverrides, expectedProblem) => {
    const result = evaluateReconciliation({
      report: createReport(reportOverrides),
      rules,
      config,
    });

    expect(result.isClean).toBe(false);
    expect(result.problems).toContain(expectedProblem);
  });
});
