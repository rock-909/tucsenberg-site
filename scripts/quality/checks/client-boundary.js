const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");

const ROOT = process.cwd();

const BUDGET_PATH = "docs/proof/baselines/client-boundary-budget.json";
const CLIENT_BOUNDARY_REPORT_PATH =
  "reports/quality/client-boundary-budget.json";
const SOURCE_ROOT = "src";
const BUDGET_VERSION = 1;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const CLIENT_BOUNDARY_EXCLUDED_DIR_NAMES = new Set([
  "__fixtures__",
  "__mocks__",
  "__tests__",
  "mock",
  "mocks",
  "spec",
  "specs",
  "stories",
  "storybook",
  ".storybook",
]);
const CLIENT_BOUNDARY_EXCLUDED_FILE_PATTERN =
  /\.(?:mock|spec|stories|story|test)\.[cm]?(?:ts|tsx)$/u;

function toRepoPath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function isClientBoundaryExcludedPath(repoPath) {
  if (repoPath.startsWith("src/test/")) return true;
  if (repoPath.startsWith("src/testing/")) return true;
  if (CLIENT_BOUNDARY_EXCLUDED_FILE_PATTERN.test(repoPath)) return true;

  return repoPath
    .split("/")
    .some((part) => CLIENT_BOUNDARY_EXCLUDED_DIR_NAMES.has(part));
}

function collectSourceFiles(rootDir) {
  const srcDir = path.join(rootDir, SOURCE_ROOT);
  const results = [];
  if (!fs.existsSync(srcDir)) return results;

  function walk(currentPath) {
    const repoPath = toRepoPath(rootDir, currentPath);
    if (isClientBoundaryExcludedPath(repoPath)) return;

    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      for (const entry of fs.readdirSync(currentPath, {
        withFileTypes: true,
      })) {
        walk(path.join(currentPath, entry.name));
      }
      return;
    }

    if (stats.isFile() && SOURCE_EXTENSIONS.has(path.extname(currentPath))) {
      results.push(currentPath);
    }
  }

  walk(srcDir);
  return results.sort((left, right) => left.localeCompare(right));
}

function hasTopLevelUseClientDirective(source) {
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  return ast.program.directives.some(
    (directive) => directive.value.value === "use client",
  );
}

function collectClientBoundaryFiles(rootDir = ROOT) {
  const clientBoundaries = [];

  for (const filePath of collectSourceFiles(rootDir)) {
    if (!hasTopLevelUseClientDirective(fs.readFileSync(filePath, "utf8"))) {
      continue;
    }
    clientBoundaries.push(toRepoPath(rootDir, filePath));
  }

  return clientBoundaries.sort((left, right) => left.localeCompare(right));
}

function createBudgetError(kind, message) {
  return {
    kind,
    file: BUDGET_PATH,
    message,
  };
}

function isValidBudgetShape(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    value.version === BUDGET_VERSION &&
    Number.isInteger(value.maxClientBoundaries) &&
    value.maxClientBoundaries >= 0 &&
    Array.isArray(value.allowedClientBoundaries) &&
    value.allowedClientBoundaries.every((item) => typeof item === "string")
  );
}

function readBudget(rootDir) {
  const budgetFile = path.join(rootDir, BUDGET_PATH);
  if (!fs.existsSync(budgetFile)) {
    return {
      budget: null,
      errors: [
        createBudgetError(
          "budget-missing",
          "Client boundary budget file is missing.",
        ),
      ],
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(budgetFile, "utf8"));
    if (!isValidBudgetShape(parsed)) {
      return {
        budget: null,
        errors: [
          createBudgetError(
            "budget-invalid",
            "Client boundary budget must define version 1, maxClientBoundaries, and allowedClientBoundaries.",
          ),
        ],
      };
    }

    return {
      budget: {
        version: parsed.version,
        maxClientBoundaries: parsed.maxClientBoundaries,
        allowedClientBoundaries: parsed.allowedClientBoundaries.toSorted(
          (left, right) => left.localeCompare(right),
        ),
      },
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      budget: null,
      errors: [createBudgetError("budget-invalid-json", message)],
    };
  }
}

function writeClientBoundaryReport(rootDir, payload) {
  const reportFile = path.join(rootDir, CLIENT_BOUNDARY_REPORT_PATH);
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function createUnexpectedBoundaryErrors(clientBoundaries, budget) {
  const allowed = new Set(budget.allowedClientBoundaries);

  const errors = [];
  for (const file of clientBoundaries) {
    if (allowed.has(file)) continue;
    errors.push({
      kind: "unexpected-client-boundary",
      file,
      message: "Client boundary is not listed in the committed budget.",
    });
  }

  return errors;
}

function createStaleBoundaryErrors(clientBoundaries, budget) {
  const actual = new Set(clientBoundaries);

  const errors = [];
  for (const file of budget.allowedClientBoundaries) {
    if (actual.has(file)) continue;
    errors.push({
      kind: "stale-client-boundary",
      file,
      message:
        "Client boundary is listed in the committed budget but is not detected in src.",
    });
  }

  return errors;
}

function createBudgetExceededError(clientBoundaries, budget) {
  if (clientBoundaries.length <= budget.maxClientBoundaries) return null;

  return createBudgetError(
    "budget-exceeded",
    `Detected ${clientBoundaries.length} client boundaries, but the budget allows ${budget.maxClientBoundaries}.`,
  );
}

function runClientBoundaryBudgetCheck(rootDir = ROOT) {
  const clientBoundaries = collectClientBoundaryFiles(rootDir);
  const { budget, errors: budgetErrors } = readBudget(rootDir);
  const errors = [...budgetErrors];
  let unexpectedClientBoundaries = [];
  let staleClientBoundaries = [];

  if (budget) {
    const unexpectedErrors = createUnexpectedBoundaryErrors(
      clientBoundaries,
      budget,
    );
    unexpectedClientBoundaries = unexpectedErrors.map((error) => error.file);
    errors.push(...unexpectedErrors);

    const staleErrors = createStaleBoundaryErrors(clientBoundaries, budget);
    staleClientBoundaries = staleErrors.map((error) => error.file);
    errors.push(...staleErrors);

    const budgetExceededError = createBudgetExceededError(
      clientBoundaries,
      budget,
    );
    if (budgetExceededError) errors.push(budgetExceededError);
  }

  const result = {
    status: errors.length === 0 ? "passed" : "failed",
    budgetPath: BUDGET_PATH,
    reportPath: CLIENT_BOUNDARY_REPORT_PATH,
    clientBoundaries,
    unexpectedClientBoundaries,
    staleClientBoundaries,
    maxClientBoundaries: budget?.maxClientBoundaries ?? null,
    errors,
  };

  writeClientBoundaryReport(rootDir, {
    createdAt: new Date().toISOString(),
    ...result,
  });

  return result;
}

function runClientBoundaryCli() {
  const result = runClientBoundaryBudgetCheck(ROOT);

  console.log(
    `[client-boundary-budget] ${result.status}: ${result.clientBoundaries.length} client boundary file(s)`,
  );
  for (const error of result.errors) {
    console.log(`- ERROR ${error.file} ${error.kind}: ${error.message}`);
  }

  return result.status !== "failed";
}

module.exports = {
  collectClientBoundaryFiles,
  hasTopLevelUseClientDirective,
  runClientBoundaryBudgetCheck,
  runClientBoundaryCli,
};
