const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const SUPPORTED_SCHEMA_VERSION = 3;
const UNLISTED_DIAGNOSTIC_NAMESPACES = new Set(["deslop", "knip"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectProjectProblems(projects) {
  const problems = [];
  if (!Array.isArray(projects) || projects.length === 0) {
    return ["report.projects must contain at least one project"];
  }

  projects.forEach((project, index) => {
    if (!isRecord(project) || project.complete !== true) {
      problems.push(`project ${index + 1} is incomplete`);
    }
    if (
      isRecord(project) &&
      Array.isArray(project.skippedChecks) &&
      project.skippedChecks.length > 0
    ) {
      problems.push(`project ${index + 1} skipped checks`);
    }
    if (
      isRecord(project) &&
      isRecord(project.skippedCheckReasons) &&
      Object.keys(project.skippedCheckReasons).length > 0
    ) {
      problems.push(`project ${index + 1} has skipped check reasons`);
    }
  });
  return problems;
}

function normalizeDiagnostics(value) {
  const problems = [];
  if (!Array.isArray(value)) {
    return {
      diagnostics: [],
      problems: ["report.diagnostics must be an array"],
      sourceCount: 0,
    };
  }

  const diagnostics = value.flatMap((diagnostic, index) => {
    if (!isRecord(diagnostic)) {
      problems.push(`diagnostic ${index + 1} must be an object`);
      return [];
    }
    if (
      typeof diagnostic.plugin !== "string" ||
      typeof diagnostic.rule !== "string"
    ) {
      problems.push(`diagnostic ${index + 1} has no rule identity`);
      return [];
    }

    return [
      {
        filePath:
          typeof diagnostic.normalizedFilePath === "string"
            ? diagnostic.normalizedFilePath
            : String(diagnostic.filePath ?? "unknown"),
        line: Number.isInteger(diagnostic.line) ? diagnostic.line : 0,
        ruleId: `${diagnostic.plugin}/${diagnostic.rule}`,
      },
    ];
  });
  return { diagnostics, problems, sourceCount: value.length };
}

function evaluateReport(report) {
  if (!isRecord(report)) {
    return { diagnostics: [], problems: ["report must be an object"] };
  }

  const problems = [];

  if (report.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    problems.push(`unsupported schemaVersion: ${String(report.schemaVersion)}`);
  }
  if (report.ok !== true) problems.push("report.ok is not true");
  if (report.mode !== "full") problems.push('report.mode must be "full"');

  const normalized = normalizeDiagnostics(report.diagnostics);
  problems.push(...normalized.problems);

  const totalDiagnosticCount = isRecord(report.summary)
    ? report.summary.totalDiagnosticCount
    : undefined;
  if (!Number.isInteger(totalDiagnosticCount) || totalDiagnosticCount < 0) {
    problems.push(
      "summary.totalDiagnosticCount must be a non-negative integer",
    );
  } else if (totalDiagnosticCount !== normalized.sourceCount) {
    problems.push("diagnostic count mismatch");
  }
  problems.push(...collectProjectProblems(report.projects));

  return { diagnostics: normalized.diagnostics, problems };
}

function evaluateOverrideRules(rules, config) {
  const problems = [];
  const knownRuleIds = new Set();
  if (!Array.isArray(rules)) {
    problems.push("rules catalog must be an array");
  } else {
    for (const rule of rules) {
      if (isRecord(rule) && typeof rule.key === "string") {
        knownRuleIds.add(rule.key);
      }
    }
    if (knownRuleIds.size === 0) problems.push("rules catalog is empty");
  }

  const configuredRuleIds = new Set();
  const overrides =
    isRecord(config) && isRecord(config.ignore)
      ? config.ignore.overrides
      : undefined;
  if (!Array.isArray(overrides)) {
    problems.push("doctor.config.json ignore.overrides must be an array");
  } else {
    overrides.forEach((override, index) => {
      if (
        !isRecord(override) ||
        !Array.isArray(override.rules) ||
        override.rules.length === 0
      ) {
        problems.push(`override ${index + 1} must list at least one rule ID`);
        return;
      }
      for (const ruleId of override.rules) {
        if (typeof ruleId !== "string") {
          problems.push(`override ${index + 1} contains a non-string rule ID`);
        } else {
          configuredRuleIds.add(ruleId);
        }
      }
    });
  }

  const unknownRuleIds = [];
  const unverifiedRuleIds = [];
  for (const ruleId of configuredRuleIds) {
    if (knownRuleIds.has(ruleId)) continue;
    const namespace = ruleId.includes("/") ? ruleId.split("/", 1)[0] : "";
    if (UNLISTED_DIAGNOSTIC_NAMESPACES.has(namespace)) {
      unverifiedRuleIds.push(ruleId);
    } else {
      unknownRuleIds.push(ruleId);
    }
  }
  unknownRuleIds.sort();
  unverifiedRuleIds.sort();

  return { problems, unknownRuleIds, unverifiedRuleIds };
}

function evaluateReconciliation({ report, rules, config }) {
  const reportResult = evaluateReport(report);
  const overrideResult = evaluateOverrideRules(rules, config);
  const problems = [...reportResult.problems, ...overrideResult.problems];

  return {
    isClean:
      problems.length === 0 &&
      reportResult.diagnostics.length === 0 &&
      overrideResult.unknownRuleIds.length === 0,
    diagnostics: reportResult.diagnostics,
    problems,
    unknownRuleIds: overrideResult.unknownRuleIds,
    unverifiedRuleIds: overrideResult.unverifiedRuleIds,
  };
}

function runJsonCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: path.resolve(__dirname, ".."),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${label} exited ${String(result.status)}: ${result.stderr.trim()}`,
    );
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${label} did not return valid JSON`, { cause: error });
  }
}

function formatResult(result) {
  if (result.isClean) {
    const lines = [
      "## React Doctor 全量对账",
      "",
      "A+B 均通过：0 条发现，规则目录覆盖的 override ID 全部有效。",
    ];
    if (result.unverifiedRuleIds.length > 0) {
      lines.push(
        "",
        `${result.unverifiedRuleIds.length} 条 dead-code/外部诊断 ID 不在 rules list 中，由全量零报告守卫。`,
      );
    }
    return lines;
  }

  const lines = ["## React Doctor 全量对账", ""];
  if (result.problems.length > 0) {
    lines.push("### 扫描完整性问题", "");
    lines.push(...result.problems.map((problem) => `- ${problem}`), "");
  }
  if (result.unknownRuleIds.length > 0) {
    lines.push("### 无效 override 规则 ID", "");
    lines.push(...result.unknownRuleIds.map((ruleId) => `- \`${ruleId}\``), "");
  }
  if (result.diagnostics.length > 0) {
    lines.push("### 未被抑制的发现项", "");
    lines.push(
      ...result.diagnostics.map(
        ({ ruleId, filePath, line }) =>
          `- \`${ruleId}\` — \`${filePath}:${line}\``,
      ),
      "",
    );
  }
  if (result.unverifiedRuleIds.length > 0) {
    lines.push(
      "### rules list 未覆盖的诊断 ID",
      "",
      ...result.unverifiedRuleIds.map((ruleId) => `- \`${ruleId}\``),
      "",
    );
  }
  return lines;
}

function appendStepSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
}

function main() {
  try {
    const report = runJsonCommand(
      "pnpm",
      ["react:doctor:report"],
      "React Doctor full report",
    );
    if (!isRecord(report) || typeof report.version !== "string") {
      throw new Error("React Doctor report has no version");
    }

    const rules = runJsonCommand(
      "npx",
      [
        "--loglevel=error",
        "-y",
        `react-doctor@${report.version}`,
        "rules",
        "list",
        "--json",
      ],
      "React Doctor rules list",
    );
    const configPath = path.resolve(__dirname, "..", "doctor.config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const result = evaluateReconciliation({ report, rules, config });
    const lines = formatResult(result);

    console.log(lines.join("\n"));
    appendStepSummary(lines);
    if (!result.isClean) {
      if (process.env.GITHUB_ACTIONS === "true") {
        console.log(
          "::warning title=React Doctor 全量对账::发现未抑制诊断、无效 override 规则 ID 或扫描不完整，请查看步骤摘要。",
        );
      }
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lines = ["## React Doctor 全量对账", "", `执行失败：${message}`];
    console.error(lines.join("\n"));
    appendStepSummary(lines);
    if (process.env.GITHUB_ACTIONS === "true") {
      console.log(
        "::warning title=React Doctor 全量对账::对账命令执行失败，请查看步骤日志。",
      );
    }
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { evaluateReconciliation, formatResult };
