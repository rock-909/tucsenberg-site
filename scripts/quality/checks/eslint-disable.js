const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

const GUARDRAIL_REGISTER_PATH = "docs/ref/maintainers.md";
const GUARDRAIL_EXCEPTION_PATTERN =
  /\bguardrail-exception\s+(GSE-\d{8}-[a-z0-9-]+):\s*(\S.+)$/i;
const ACTIVE_GUARDRAIL_EXCEPTION_HEADING =
  /^## Active production structural exceptions\s*$/im;
const CONFIG_FILE_PATTERN = /(?:^|\/)[^/]+\.config\.(?:js|ts|mjs|mts)$/i;
const STRUCTURAL_GUARDRAIL_RULES = new Set([
  "complexity",
  "max-depth",
  "max-lines",
  "max-lines-per-function",
  "max-nested-callbacks",
  "max-params",
  "max-statements",
]);
const ESLINT_DIRECTIVE_PATTERN = /eslint-disable|eslint-enable/;

function getRepoFiles() {
  try {
    const output = execSync(
      "git ls-files --cached --others --exclude-standard",
      {
        encoding: "utf8",
        cwd: ROOT,
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    return output.split("\n").flatMap((line) => {
      const trimmed = line.trim();
      return trimmed ? [trimmed] : [];
    });
  } catch (error) {
    console.error("[eslint-disable-check] Failed to list git files:", error);
    process.exit(1);
  }
}

function isLintSourceFile(filePath) {
  if (
    !(
      filePath.startsWith("src/") ||
      filePath.startsWith("tests/") ||
      filePath.startsWith("scripts/")
    )
  ) {
    return false;
  }

  return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(
    path.extname(filePath),
  );
}

function isTestFile(filePath) {
  if (filePath.startsWith("tests/")) return true;
  if (filePath.startsWith("src/test/")) return true;
  if (filePath.includes("/__tests__/")) return true;
  if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)) return true;
  if (filePath.startsWith("src/types/test-")) return true;

  return false;
}

function isStructuralGuardrailExemptPath(filePath) {
  if (CONFIG_FILE_PATTERN.test(filePath)) return true;
  if (filePath.startsWith("src/components/dev-tools/")) return true;
  if (/^src\/app\/.+\/dev-tools\//.test(filePath)) return true;

  return false;
}

function isProductionFile(filePath) {
  if (!filePath.startsWith("src/")) return false;
  if (isTestFile(filePath)) return false;
  if (filePath.startsWith("src/scripts/")) return false;
  if (isStructuralGuardrailExemptPath(filePath)) return false;

  return true;
}

function isValidRuleName(rule) {
  return /^[@\w/-]+$/.test(rule);
}

function stripTrailingCommentEnd(text) {
  return text.replace(/\*\/\s*\}?$/, "").trim();
}

function getActiveGuardrailExceptionSection(registerContent) {
  const headingMatch = registerContent.match(
    ACTIVE_GUARDRAIL_EXCEPTION_HEADING,
  );
  if (!headingMatch || headingMatch.index === undefined) return "";

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const sectionContent = registerContent.slice(sectionStart);
  const nextHeadingIndex = sectionContent.search(/^##\s+/m);

  return nextHeadingIndex === -1
    ? sectionContent
    : sectionContent.slice(0, nextHeadingIndex);
}

function collectRegisteredGuardrailExceptionIds(registerContent) {
  const ids = new Set();
  const activeSection = getActiveGuardrailExceptionSection(registerContent);
  if (activeSection.length === 0) return ids;

  const idPattern = /\|\s*(GSE-\d{8}-[a-z0-9-]+)\s*\|/gi;
  let match = idPattern.exec(activeSection);

  while (match) {
    ids.add(match[1].toLowerCase());
    match = idPattern.exec(activeSection);
  }

  return ids;
}

function readRegisteredGuardrailExceptionIds() {
  const registerPath = path.join(ROOT, GUARDRAIL_REGISTER_PATH);

  try {
    return collectRegisteredGuardrailExceptionIds(
      fs.readFileSync(registerPath, "utf8"),
    );
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return new Set();
    }
    throw error;
  }
}

function parseGuardrailException(reason) {
  const match = reason.match(GUARDRAIL_EXCEPTION_PATTERN);
  if (!match) return null;

  return {
    id: match[1].toLowerCase(),
    detail: match[2].trim(),
  };
}

function parseDisableDirective(line, directive) {
  const idx = line.indexOf(directive);
  if (idx === -1) return null;

  const rawRest = stripTrailingCommentEnd(line.slice(idx + directive.length));
  const rest = rawRest.trim();
  const reasonIdx = rest.indexOf("--");
  const rulesText = (reasonIdx === -1 ? rest : rest.slice(0, reasonIdx)).trim();
  const reason = (reasonIdx === -1 ? "" : rest.slice(reasonIdx + 2)).trim();
  const rules = rulesText.split(",").flatMap((rule) => {
    const trimmed = rule.trim();
    return trimmed ? [trimmed] : [];
  });

  return { rules, reason };
}

function analyzeSource(filePath, content, options = {}) {
  const registeredGuardrailExceptionIds =
    options.registeredGuardrailExceptionIds ?? new Set();
  const lines = content.split("\n");
  const findings = [];
  const testFile = isTestFile(filePath);
  const productionFile = isProductionFile(filePath);

  function extractDirectiveText(trimmed) {
    if (trimmed.startsWith("//")) return trimmed.slice(2).trim();
    if (trimmed.startsWith("/*")) return trimmed.slice(2).trim();
    if (trimmed.startsWith("*")) return trimmed.slice(1).trim();

    const jsxBlockIdx = trimmed.indexOf("{/*");
    if (jsxBlockIdx !== -1) {
      return trimmed.slice(jsxBlockIdx + 3).trim();
    }

    return null;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i] ?? "";
    const directiveMarker = ESLINT_DIRECTIVE_PATTERN.exec(rawLine)?.[0];
    if (directiveMarker !== "eslint-disable") continue;

    const trimmed = rawLine.trim();
    const directiveText = extractDirectiveText(trimmed);
    if (!directiveText) continue;

    const directiveMatch = directiveText.match(
      /^eslint-disable(?:-next-line|-line)?\b/,
    );
    if (!directiveMatch) continue;

    const directive = directiveMatch[0];
    const parsed = parseDisableDirective(directiveText, directive);
    if (!parsed) continue;

    const violations = [];
    if (parsed.rules.length === 0) {
      violations.push("missing explicit rule name");
    }

    for (const rule of parsed.rules) {
      if (!isValidRuleName(rule)) {
        violations.push(`invalid rule name: ${rule}`);
      }
    }

    if (productionFile && parsed.reason.length === 0) {
      violations.push("missing production-code reason");
    }

    const structuralRules = parsed.rules.filter((rule) =>
      STRUCTURAL_GUARDRAIL_RULES.has(rule),
    );
    if (
      structuralRules.length > 0 &&
      productionFile &&
      !testFile &&
      !isStructuralGuardrailExemptPath(filePath)
    ) {
      const exception = parseGuardrailException(parsed.reason);
      if (!exception) {
        violations.push(
          "missing guardrail exception id (use `-- guardrail-exception GSE-YYYYMMDD-short-slug: real boundary ...`)",
        );
      } else if (!registeredGuardrailExceptionIds.has(exception.id)) {
        violations.push(`unregistered guardrail exception id: ${exception.id}`);
      }
    }

    if (violations.length > 0) {
      findings.push({
        filePath,
        line: i + 1,
        directive,
        content: trimmed,
        violations,
      });
    }
  }

  return findings;
}

function analyzeFile(filePath, options = {}) {
  const absolute = path.join(ROOT, filePath);
  let content;
  try {
    content = fs.readFileSync(absolute, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return analyzeSource(filePath, content, options);
}

function runEslintDisableCheck() {
  const files = getRepoFiles().filter(isLintSourceFile);
  const registeredGuardrailExceptionIds = readRegisteredGuardrailExceptionIds();
  const allFindings = [];

  for (const file of files) {
    allFindings.push(...analyzeFile(file, { registeredGuardrailExceptionIds }));
  }

  if (allFindings.length === 0) {
    console.log("[eslint-disable-check] OK (no violations)");
    return true;
  }

  console.log(`[eslint-disable-check] Violations: ${allFindings.length}\n`);
  for (const finding of allFindings) {
    console.log(
      `- ${finding.filePath}:${finding.line} ${finding.directive}: ${finding.violations.join(
        "; ",
      )}`,
    );
    console.log(`  ${finding.content}`);
  }

  return false;
}

module.exports = {
  analyzeFile,
  analyzeSource,
  collectRegisteredGuardrailExceptionIds,
  getActiveGuardrailExceptionSection,
  isProductionFile,
  isStructuralGuardrailExemptPath,
  isTestFile,
  parseGuardrailException,
  runEslintDisableCheck,
  STRUCTURAL_GUARDRAIL_RULES,
};
