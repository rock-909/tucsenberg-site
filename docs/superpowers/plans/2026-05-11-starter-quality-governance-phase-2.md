# Starter Checks Content Slugs Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the `content-slugs` quality check from `scripts/starter-checks.js` into a focused module while preserving the public command `node scripts/starter-checks.js content-slugs`.

**Architecture:** Keep `scripts/starter-checks.js` as the compatibility router and legacy export facade. Move the slug-sync logic, CLI argument parsing, summary printing, and JSON report writer into `scripts/quality/checks/content-slugs.js` as CommonJS so the existing Node script can require it without changing package/module settings.

**Tech Stack:** Node.js 24 CommonJS scripts, `gray-matter`, `glob`, `js-yaml`, Vitest, pnpm, existing starter quality CLI.

---

## Why this is Phase 2 target

Phase 1 made the split plan explicit. The safest first extraction is `content-slugs` because:

- It does not need network access, Cloudflare credentials, deployment state, generated `.next`, or external URLs.
- It already has focused tests in `tests/unit/scripts/content-slug-sync.test.ts` and `tests/unit/scripts/mdx-slug-sync.test.ts`.
- Its public command surface is small: default run, `--json`, `--help`, `--collections`, `--locales`, and `--quiet`.
- It is part of `pnpm content:check`, so compatibility can be proven through both the direct CLI and the package script.

Do not extract `release-verify`, Cloudflare smoke commands, `validate-production-config`, or other launch-proof commands in this phase.

## File structure

- Create: `/Users/Data/workspace/showcase-website-starter/scripts/quality/checks/content-slugs.js`
  - Owns MDX slug pair validation, CLI option parsing, console summary, and JSON report writing.
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js`
  - Imports the new module.
  - Keeps `node scripts/starter-checks.js content-slugs` as the public command.
  - Re-exports the same helpers that existing tests and callers currently import from `scripts/starter-checks.js`.
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/mdx-slug-sync.test.ts`
  - Imports core slug-sync helpers from the new focused module.
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/content-slug-sync.test.ts`
  - Adds compatibility coverage for `--json` report output and keeps the old CLI path as the tested public entry.
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/starter-checks-split-plan.md`
  - Records that `content-slugs` is the Phase 2 extraction target after implementation.

## Non-goals

- Do not rename `node scripts/starter-checks.js content-slugs`.
- Do not change output text, report path, or exit-code meaning.
- Do not rewrite the content manifest generator.
- Do not change MDX frontmatter rules.
- Do not add dependencies.
- Do not touch Cloudflare, release proof, or deployment smoke commands.

---

### Task 1: Add a direct compatibility test for JSON report output

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/content-slug-sync.test.ts`

- [ ] **Step 1: Add safe report cleanup helpers**

In `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/content-slug-sync.test.ts`, replace the imports at the top:

```ts
import { spawn } from "child_process";
import * as path from "path";
import { describe, expect, it } from "vitest";
```

with:

```ts
import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, describe, expect, it } from "vitest";
```

Then add these constants and helper below `const CLI_PATH = ...`:

```ts
const REPORT_PATH = path.resolve(
  __dirname,
  "../../../reports/content-slug-sync-report.json",
);
const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-content-slug-sync-report-trash",
);

function moveReportToTrash(): void {
  if (!fs.existsSync(REPORT_PATH)) {
    return;
  }

  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  const targetPath = path.join(
    TEMP_TRASH_ROOT,
    `content-slug-sync-report-${Date.now()}.json`,
  );

  fs.renameSync(REPORT_PATH, targetPath);
}

afterEach(() => {
  moveReportToTrash();
});
```

- [ ] **Step 2: Add JSON report compatibility test**

In the `describe("runs against real content", () => { ... })` block, add this test after `should run validation on project content`:

```ts
it("should preserve --json report output path and payload", async () => {
  const result = await runCLI(["--json"]);

  expect(result.code).toBe(0);
  expect(result.stdout).toContain("JSON report saved to:");
  expect(result.stdout).toContain("reports/content-slug-sync-report.json");
  expect(fs.existsSync(REPORT_PATH)).toBe(true);

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8")) as {
    ok: boolean;
    tool: string;
    checkedCollections: string[];
    checkedLocales: string[];
  };

  expect(report.ok).toBe(true);
  expect(report.tool).toBe("content-slug-sync");
  expect(report.checkedCollections).toEqual(["posts", "pages", "products"]);
  expect(report.checkedLocales).toEqual(["en", "zh"]);
});
```

- [ ] **Step 3: Run the characterization test before moving code**

Run:

```bash
pnpm test -- tests/unit/scripts/content-slug-sync.test.ts
```

Expected: PASS. This is a characterization check for current behavior before refactoring.

- [ ] **Step 4: Commit the characterization test**

Run:

```bash
git add tests/unit/scripts/content-slug-sync.test.ts
git commit -m "test: cover content slug json report contract"
```

Expected: commit succeeds with only the CLI compatibility test staged.

---

### Task 2: Create the failing module-boundary test

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/mdx-slug-sync.test.ts`

- [ ] **Step 1: Point core tests at the future focused module**

In `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/mdx-slug-sync.test.ts`, replace:

```ts
// Import the module under test
const {
  validateMdxSlugSync,
  buildKey,
  parseFrontmatter,
  validateCollectionPair,
} = require("../../../scripts/starter-checks.js");
```

with:

```ts
// Import the focused module under test.
const {
  validateMdxSlugSync,
  buildKey,
  parseFrontmatter,
  validateCollectionPair,
} = require("../../../scripts/quality/checks/content-slugs.js");
```

- [ ] **Step 2: Run the focused test and watch it fail**

Run:

```bash
pnpm test -- tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: FAIL with a module resolution error similar to:

```text
Cannot find module '../../../scripts/quality/checks/content-slugs.js'
```

If it fails for a different reason, stop and fix the test setup before implementation.

---

### Task 3: Create the focused content-slugs module

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/scripts/quality/checks/content-slugs.js`

- [ ] **Step 1: Add the module implementation**

Create `/Users/Data/workspace/showcase-website-starter/scripts/quality/checks/content-slugs.js` with this content:

```js
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const { glob } = require("glob");
const yaml = require("js-yaml");

const DEFAULT_COLLECTIONS = ["posts", "pages", "products"];
const DEFAULT_LOCALES = ["en", "zh"];
const REPORT_DIR = "reports";
const CONTENT_SLUG_REPORT_FILENAME = "content-slug-sync-report.json";
const matterOptions = {
  engines: {
    yaml: {
      parse: (str) => yaml.load(str),
      stringify: (obj) => yaml.dump(obj),
    },
  },
};

function buildKey(rootDir, filePath, collection, locale) {
  const localeRoot = path.join(rootDir, "content", collection, locale);
  const relative = path.relative(localeRoot, filePath);
  return `${collection}/${relative.replace(/\\/g, "/")}`;
}

function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content, matterOptions);

    if (!data || typeof data.slug !== "string") {
      return {
        slug: null,
        error: "frontmatter.slug is missing or not a string",
      };
    }

    return { slug: data.slug, error: null };
  } catch (err) {
    return { slug: null, error: `Failed to parse: ${err.message}` };
  }
}

function collectPairs(rootDir, collection, baseLocale, targetLocale) {
  const basePattern = path.join(
    rootDir,
    "content",
    collection,
    baseLocale,
    "**/*.mdx",
  );
  const targetPattern = path.join(
    rootDir,
    "content",
    collection,
    targetLocale,
    "**/*.mdx",
  );
  const pairMap = new Map();

  for (const filePath of glob.sync(basePattern)) {
    const key = buildKey(rootDir, filePath, collection, baseLocale);
    const entry = pairMap.get(key) || {};
    entry.basePath = filePath;
    pairMap.set(key, entry);
  }

  for (const filePath of glob.sync(targetPattern)) {
    const key = buildKey(rootDir, filePath, collection, targetLocale);
    const entry = pairMap.get(key) || {};
    entry.targetPath = filePath;
    pairMap.set(key, entry);
  }

  return pairMap;
}

function validateCollectionPair(rootDir, collection, baseLocale, targetLocale) {
  const issues = [];
  const pairMap = collectPairs(rootDir, collection, baseLocale, targetLocale);
  let fileCount = 0;

  for (const [, { basePath, targetPath }] of pairMap) {
    fileCount += (basePath ? 1 : 0) + (targetPath ? 1 : 0);

    if (!basePath || !targetPath) {
      const missingLocale = !basePath ? baseLocale : targetLocale;
      const existingPath = basePath || targetPath;
      issues.push({
        type: "missing_pair",
        collection,
        baseLocale,
        targetLocale,
        basePath,
        targetPath,
        message: `Missing ${missingLocale} counterpart for: ${path.basename(existingPath)}`,
      });
      continue;
    }

    const baseResult = parseFrontmatter(basePath);
    const targetResult = parseFrontmatter(targetPath);

    if (baseResult.error || targetResult.error) {
      issues.push({
        type: "parse_error",
        collection,
        baseLocale,
        targetLocale,
        basePath,
        targetPath,
        message: "Failed to parse frontmatter.slug",
        error: baseResult.error || targetResult.error,
      });
      continue;
    }

    if (baseResult.slug !== targetResult.slug) {
      issues.push({
        type: "slug_mismatch",
        collection,
        baseLocale,
        targetLocale,
        basePath,
        targetPath,
        baseSlug: baseResult.slug,
        targetSlug: targetResult.slug,
        message: `Slug mismatch: "${baseResult.slug}" (${baseLocale}) vs "${targetResult.slug}" (${targetLocale})`,
      });
    }
  }

  return {
    issues,
    pairCount: pairMap.size,
    fileCount,
  };
}

function validateMdxSlugSync(options) {
  const {
    rootDir,
    collections = DEFAULT_COLLECTIONS,
    locales = DEFAULT_LOCALES,
    baseLocale = locales[0],
  } = options;
  const issues = [];
  const targetLocales = locales.filter((locale) => locale !== baseLocale);
  let totalFiles = 0;
  let totalPairs = 0;

  for (const collection of collections) {
    for (const targetLocale of targetLocales) {
      const result = validateCollectionPair(
        rootDir,
        collection,
        baseLocale,
        targetLocale,
      );
      issues.push(...result.issues);
      totalFiles += result.fileCount;
      totalPairs += result.pairCount;
    }
  }

  return {
    ok: issues.length === 0,
    checkedCollections: collections,
    checkedLocales: locales,
    issues,
    stats: {
      totalFiles,
      totalPairs,
      missingPairs: issues.filter((issue) => issue.type === "missing_pair")
        .length,
      slugMismatches: issues.filter((issue) => issue.type === "slug_mismatch")
        .length,
      parseErrors: issues.filter((issue) => issue.type === "parse_error")
        .length,
    },
  };
}

function parseContentSlugArgs(args) {
  const options = {
    json: false,
    quiet: false,
    help: false,
    collections: DEFAULT_COLLECTIONS,
    locales: DEFAULT_LOCALES,
  };

  for (const arg of args) {
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--quiet") {
      options.quiet = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("--collections=")) {
      options.collections = arg
        .split("=")[1]
        .split(",")
        .flatMap((item) => {
          const trimmed = item.trim();
          return trimmed ? [trimmed] : [];
        });
    } else if (arg.startsWith("--locales=")) {
      options.locales = arg
        .split("=")[1]
        .split(",")
        .flatMap((item) => {
          const trimmed = item.trim();
          return trimmed ? [trimmed] : [];
        });
    }
  }

  return options;
}

function printContentSlugHelp() {
  console.log(`
MDX Content Slug Sync Validator

Usage:
  node scripts/starter-checks.js content-slugs [options]

Options:
  --json              Output JSON report to reports/content-slug-sync-report.json
  --collections=x,y   Collections to check (default: posts,pages,products)
  --locales=x,y       Locales to check (default: en,zh)
  --quiet             Only output errors
  --help, -h          Show this help

Examples:
  node scripts/starter-checks.js content-slugs
  node scripts/starter-checks.js content-slugs --json
  node scripts/starter-checks.js content-slugs --collections=products --locales=en,zh,ja
`);
}

function printContentSlugSummary(result, options) {
  console.log("\nMDX Slug Sync Validation");
  console.log("========================\n");

  if (!options.quiet) {
    console.log(`Collections: ${result.checkedCollections.join(", ")}`);
    console.log(`Locales: ${result.checkedLocales.join(", ")}`);
    console.log(`Total files: ${result.stats.totalFiles}`);
    console.log(`Total pairs: ${result.stats.totalPairs}\n`);
  }

  if (result.ok) {
    console.log("All slug validations passed.\n");
    return;
  }

  const missingPairs = result.issues.filter(
    (issue) => issue.type === "missing_pair",
  );
  if (missingPairs.length > 0) {
    console.log(`Missing Pairs (${missingPairs.length}):`);
    for (const issue of missingPairs) {
      const existingFile = issue.basePath || issue.targetPath;
      const missingLocale = issue.basePath
        ? issue.targetLocale
        : issue.baseLocale;
      console.log(
        `   - [${issue.collection}] ${path.basename(existingFile)} (missing ${missingLocale})`,
      );
    }
    console.log("");
  }

  const slugMismatches = result.issues.filter(
    (issue) => issue.type === "slug_mismatch",
  );
  if (slugMismatches.length > 0) {
    console.log(`Slug Mismatches (${slugMismatches.length}):`);
    for (const issue of slugMismatches) {
      console.log(
        `   - [${issue.collection}] ${path.basename(issue.basePath)}`,
      );
      console.log(`     ${issue.baseLocale}: "${issue.baseSlug}"`);
      console.log(`     ${issue.targetLocale}: "${issue.targetSlug}"`);
    }
    console.log("");
  }

  const parseErrors = result.issues.filter(
    (issue) => issue.type === "parse_error",
  );
  if (parseErrors.length > 0) {
    console.log(`Parse Errors (${parseErrors.length}):`);
    for (const issue of parseErrors) {
      const file = issue.basePath || issue.targetPath;
      console.log(`   - [${issue.collection}] ${path.basename(file)}`);
      if (issue.error) console.log(`     Error: ${issue.error}`);
    }
    console.log("");
  }

  console.log("Summary:");
  console.log(`   Missing pairs: ${result.stats.missingPairs}`);
  console.log(`   Slug mismatches: ${result.stats.slugMismatches}`);
  console.log(`   Parse errors: ${result.stats.parseErrors}`);
  console.log(`   Total issues: ${result.issues.length}\n`);
}

function writeContentSlugJsonReport(result, rootDir) {
  const reportDir = path.join(rootDir, REPORT_DIR);
  const reportPath = path.join(reportDir, CONTENT_SLUG_REPORT_FILENAME);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        tool: "content-slug-sync",
        version: "1.0.0",
        ...result,
      },
      null,
      2,
    ),
  );
  console.log(`JSON report saved to: ${reportPath}\n`);
}

function runContentSlugCheck(args = [], rootDir = process.cwd()) {
  const options = parseContentSlugArgs(args);
  if (options.help) {
    printContentSlugHelp();
    return true;
  }
  if (options.collections.length === 0) {
    console.error("Error: No collections specified");
    return false;
  }
  if (options.locales.length < 2) {
    console.error("Error: At least 2 locales are required for comparison");
    return false;
  }

  const result = validateMdxSlugSync({
    rootDir,
    collections: options.collections,
    locales: options.locales,
  });
  printContentSlugSummary(result, options);
  if (options.json) writeContentSlugJsonReport(result, rootDir);

  return result.ok;
}

module.exports = {
  DEFAULT_COLLECTIONS,
  DEFAULT_LOCALES,
  buildKey,
  collectPairs,
  parseContentSlugArgs,
  parseFrontmatter,
  printContentSlugHelp,
  printContentSlugSummary,
  runContentSlugCheck,
  validateCollectionPair,
  validateMdxSlugSync,
  writeContentSlugJsonReport,
};
```

- [ ] **Step 2: Run the previously failing module test**

Run:

```bash
pnpm test -- tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: PASS. The missing module error should be gone.

- [ ] **Step 3: Commit the module extraction target**

Run:

```bash
git add scripts/quality/checks/content-slugs.js tests/unit/scripts/mdx-slug-sync.test.ts
git commit -m "refactor: extract content slug check module"
```

Expected: commit succeeds with the new module and the core test import change staged.

---

### Task 4: Wire the compatibility router to the focused module

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js`

- [ ] **Step 1: Add the focused module import**

In `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js`, remove this import because `glob` is no longer used by the router after the extraction:

```js
const { glob } = require("glob");
```

Then add this import block after the existing dependency imports:

```js
const {
  buildKey,
  collectPairs,
  parseContentSlugArgs,
  parseFrontmatter,
  runContentSlugCheck,
  validateCollectionPair,
  validateMdxSlugSync,
} = require("./quality/checks/content-slugs");
```

- [ ] **Step 2: Remove the old inline content-slugs implementation**

Delete the full block that starts with:

```js
// ---------------------------------------------------------------------------
// content slugs
// ---------------------------------------------------------------------------
```

and ends immediately before:

```js
// ---------------------------------------------------------------------------
// translations
// ---------------------------------------------------------------------------
```

After the deletion, the router should still contain the `case "content-slugs":` branch:

```js
case "content-slugs":
  ok = runContentSlugCheck(args);
  break;
```

- [ ] **Step 3: Confirm legacy exports still exist**

At the bottom `module.exports = { ... }` object, keep these entries exactly as exported names:

```js
buildKey,
collectPairs,
parseArgs: parseContentSlugArgs,
parseFrontmatter,
runContentSlugCheck,
validateCollectionPair,
validateMdxSlugSync,
```

Do not remove these exports in Phase 2, even if the core test now imports the focused module. They keep old callers and review tools compatible.

- [ ] **Step 4: Run both old-facade and new-module tests**

Run:

```bash
pnpm test -- tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run direct public CLI compatibility checks**

Run:

```bash
node scripts/starter-checks.js content-slugs
node scripts/starter-checks.js content-slugs --json
node scripts/starter-checks.js content-slugs --help
```

Expected:

- Default command exits 0 and prints `All slug validations passed.`
- `--json` exits 0 and writes `reports/content-slug-sync-report.json`.
- `--help` exits 0 and prints `MDX Content Slug Sync Validator`, `--json`, `--collections`, and `--locales`.

- [ ] **Step 6: Move the generated JSON report out of the repo workspace**

If Step 5 created `/Users/Data/workspace/showcase-website-starter/reports/content-slug-sync-report.json`, move it to a temporary trash directory instead of deleting it:

```bash
mkdir -p /tmp/showcase-content-slug-sync-report-trash
mv reports/content-slug-sync-report.json /tmp/showcase-content-slug-sync-report-trash/content-slug-sync-report-$(date +%s).json
```

Expected: the report file is no longer in the working tree, and no permanent deletion was used.

- [ ] **Step 7: Commit the router wiring**

Run:

```bash
git add scripts/starter-checks.js
git commit -m "refactor: route content slug check through module"
```

Expected: commit succeeds with only router wiring staged.

---

### Task 5: Update the split-plan status after extraction

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/starter-checks-split-plan.md`

- [ ] **Step 1: Add Phase 2 status note**

In `/Users/Data/workspace/showcase-website-starter/docs/website/starter-checks-split-plan.md`, after the `## Recommended first extraction` section and its numbered list, add:

```markdown
## Phase 2 extraction status

`content-slugs` is the first Phase 2 extraction target.

Expected post-extraction state:

- `node scripts/starter-checks.js content-slugs` remains the public command.
- Core slug-sync logic lives in `scripts/quality/checks/content-slugs.js`.
- `scripts/starter-checks.js` remains the compatibility router and legacy export facade.
- `pnpm content:check` still runs `content-slugs` before `translations`.
- `reports/content-slug-sync-report.json` remains the JSON report path for `--json`.
```

- [ ] **Step 2: Run docs-sensitive checks**

Run:

```bash
pnpm content:check
pnpm brand:check
```

Expected: both commands pass.

- [ ] **Step 3: Commit the doc status update**

Run:

```bash
git add docs/website/starter-checks-split-plan.md
git commit -m "docs: record content slug extraction target"
```

Expected: commit succeeds with only the split-plan doc staged.

---

### Task 6: Run final Phase 2 verification

**Files:**
- Read: all files changed in Tasks 1-5.

- [ ] **Step 1: Run focused unit and CLI proof**

Run:

```bash
pnpm test -- tests/unit/scripts/content-slug-sync.test.ts tests/unit/scripts/mdx-slug-sync.test.ts
node scripts/starter-checks.js content-slugs
node scripts/starter-checks.js content-slugs --json
node scripts/starter-checks.js content-slugs --help
pnpm content:check
```

Expected:

- Vitest focused tests pass.
- Public CLI commands exit 0.
- `pnpm content:check` exits 0 and still runs both slug sync and translations.

- [ ] **Step 2: Move generated report if present**

Run:

```bash
if [ -f reports/content-slug-sync-report.json ]; then
  mkdir -p /tmp/showcase-content-slug-sync-report-trash
  mv reports/content-slug-sync-report.json /tmp/showcase-content-slug-sync-report-trash/content-slug-sync-report-final-$(date +%s).json
fi
```

Expected: no generated `reports/content-slug-sync-report.json` remains in `git status --short`.

- [ ] **Step 3: Run broad safety checks**

Run:

```bash
pnpm type-check
pnpm lint:check
pnpm brand:check
```

Expected: all commands pass.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git diff --stat HEAD~4..HEAD
```

Expected:

- Working tree is clean.
- Recent commits only cover content-slugs modularization tests, module extraction, router wiring, and split-plan status.

## Self-review checklist

- Phase 2 covers exactly one extraction target: `content-slugs`.
- Public command remains `node scripts/starter-checks.js content-slugs`.
- Package script compatibility remains `pnpm content:check`.
- JSON report path remains `reports/content-slug-sync-report.json`.
- No Cloudflare, release, deployment, or production-config proof command is changed.
- Legacy exports from `scripts/starter-checks.js` remain available.
- Tests prove both focused module behavior and old CLI behavior.
