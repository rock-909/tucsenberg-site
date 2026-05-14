# React Doctor Warning Governance Implementation Plan

> **SUPERSEDED / HISTORICAL ONLY**
>
> This 2026-05-10 plan is preserved as historical context. It was superseded by
> `docs/superpowers/plans/2026-05-11-starter-quality-governance-verified-roadmap.md`,
> specifically W1-2. The current React Doctor contract keeps only
> `pnpm react:doctor` as the blocking gate and `pnpm react:doctor:report` as the
> manual JSON report command. Historical commands such as
> `react:doctor:classify`, `react:doctor:governance`, and
> `react:doctor:raw-governance` in this file must not be used as current
> execution commands. There is no separate governance/raw-governance CI layer
> after W1-2; warning classification is human backlog/reference work.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn React Doctor warnings from a 516-item raw backlog into a stable, classified, low-noise quality system that can guide repair without blocking CI on weak signals.

**Architecture:** Keep CI blocking only on React Doctor errors. Add a local classifier and tracked policy docs that split warnings by scope, rule, and project-specific exception. Then repair production issues in small waves, leave test fixture noise out of release gates, and only consider warning-level gates after the signal is stable.

**Tech Stack:** Next.js 16, React 19, TypeScript, pnpm, Vitest, GitHub Actions, React Doctor 0.1.6, Node.js scripts.

---

## Current facts this plan assumes

- Project root: `/Users/Data/workspace/showcase-website-starter`
- React Doctor command: `pnpm react:doctor`
- Report command for pure JSON: `pnpm exec react-doctor . --offline --json --fail-on none`
- Current fresh scan:
  - `errorCount: 0`
  - `warningCount: 516`
  - `affectedFileCount: 173`
  - `score: 66 / 100`
- Warning scope split from the fresh analysis:
  - tests: 324
  - production: about 149
  - scripts: 36
  - config/support: 7
- CI policy stays:
  - error blocks CI
  - warning is backlog
  - warning is not merge-blocking yet

## Files this plan will create or modify

- Create: `/Users/Data/workspace/showcase-website-starter/scripts/quality/react-doctor-classify.mjs`
  - Reads a pure React Doctor JSON report and produces bucketed JSON for humans and CI summaries.
- Create: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/react-doctor-classify.test.ts`
  - Locks classifier behavior with small fixtures.
- Create: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md`
  - Records bucket meanings, exception rules, and gate policy.
- Create: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-exceptions.md`
  - Records accepted project exceptions with exact file/rule proof.
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-baseline.md`
  - Adds the latest bucketed baseline and links to policy/exception docs.
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`
  - Explains what React Doctor proves and what it does not prove.
- Modify: `/Users/Data/workspace/showcase-website-starter/package.json`
  - Adds a non-blocking analysis script only after the classifier is tested.
- Modify later, in repair waves:
  - `/Users/Data/workspace/showcase-website-starter/src/components/security/turnstile.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/ui/theme-switcher.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/cookie/cookie-banner.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/page.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/custom-project-support/page.tsx`
  - selected section/view files with low-risk Tailwind shorthand cleanups
  - selected test fixture files after production signal is under control

## Bucket model

Use these buckets exactly:

```text
blocking-error
confirmed-real
needs-manual-proof
project-exception
test-fixture-noise
low-value-style
```

Meaning:

- `blocking-error`: React Doctor `severity === "error"`. Must be zero before merge.
- `confirmed-real`: The warning points to a real production concern with low false-positive risk.
- `needs-manual-proof`: The rule may be right, but the code has hidden runtime, order, stream, retry, or framework context.
- `project-exception`: The rule is generally useful, but this repo has an intentional exception.
- `test-fixture-noise`: The warning is in tests or support fixtures and does not prove a buyer-facing bug.
- `low-value-style`: The warning is stylistic or micro-optimization; useful for cleanup, not for release blocking.

---

### Task 1: Add the React Doctor policy document

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md`

- [ ] **Step 1: Create the policy doc**

Create `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md` with this content:

```markdown
# React Doctor Policy

React Doctor is an error-level gate in this starter.

## Gate policy

- `error` blocks CI.
- `warning` is backlog.
- Do not use `--fail-on warning` until warnings are classified, exceptions are documented, and test fixture noise is isolated.

## Buckets

| Bucket | Meaning | Merge impact |
| --- | --- | --- |
| `blocking-error` | React Doctor error. | Blocks. |
| `confirmed-real` | Real production risk or quality debt with clear proof. | Fix in repair waves. |
| `needs-manual-proof` | Rule may be right, but hidden runtime or order dependencies need proof. | Do not batch-fix. |
| `project-exception` | Tool rule is generally good, but this repo has a documented exception. | Do not fix unless the exception changes. |
| `test-fixture-noise` | Test or support fixture warning. | Do not block release. |
| `low-value-style` | Style or micro-optimization. | Cleanup only after higher-value work. |

## Current known shape

The initial integrated scan had 516 warnings and 0 errors.

Most warning volume is not production behavior:

- test and fixture files are the largest source
- many production findings are style shorthand suggestions
- scripts mostly trigger performance micro-optimization rules
- several warnings are known project exceptions

## Rules of repair

1. Do not treat warning count as bug count.
2. Do not delete code from dead-code tools without runtime and script proof.
3. Do not rewrite tests only to improve a score.
4. Do not migrate `forwardRef` or `useContext` mechanically.
5. Do not treat JSON-LD `dangerouslySetInnerHTML` as a normal XSS bug when the JSON serializer is escaping unsafe characters.
6. Keep React Doctor warning cleanup out of release blocking until the warning signal is stable.
```

- [ ] **Step 2: Check the doc exists**

Run:

```bash
test -f docs/quality/react-doctor-policy.md
```

Expected: command exits 0.

- [ ] **Step 3: Commit**

```bash
git add docs/quality/react-doctor-policy.md
git commit -m "docs: define react doctor warning policy"
```

---

### Task 2: Add an exception registry

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-exceptions.md`

- [ ] **Step 1: Create the exception registry**

Create `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-exceptions.md` with this content:

```markdown
# React Doctor Exceptions

This file records accepted React Doctor warning exceptions. Each exception needs an exact file, rule, reason, and recheck trigger.

## Accepted exceptions

### JSON-LD script injection

- File: `src/components/seo/json-ld-script.tsx`
- Rule: `no-danger`
- Bucket: `project-exception`
- Reason: JSON-LD needs a script tag with inline JSON. `generateJSONLD` escapes `<` before injection.
- Recheck when: `generateJSONLD` changes or JSON-LD data starts accepting raw HTML.

### Local SVG logo image

- File: `src/components/layout/logo.tsx`
- Rule: `nextjs-no-img-element`
- Bucket: `project-exception`
- Reason: The logo uses a local SVG and intentionally avoids pulling `next/image` runtime into the shared layout chunk.
- Recheck when: logo delivery moves to raster images, remote assets, or a CMS.

### Development-only helper scripts

- File: `src/app/[locale]/layout.tsx`
- Rule: `nextjs-no-native-script`
- Bucket: `project-exception`
- Reason: The native scripts are gated behind `NODE_ENV === "development"` and are not loaded in production.
- Recheck when: any helper script becomes production-facing.

### Catch-all localized 404 route

- File: `src/app/[locale]/[...rest]/page.tsx`
- Rule: `nextjs-missing-metadata`
- Bucket: `project-exception`
- Reason: The route only calls `notFound()` to force the localized 404 experience.
- Recheck when: the catch-all route starts rendering buyer-visible content.

### Stream reader loop

- File: `src/lib/api/safe-parse-json.ts`
- Rule: `async-await-in-loop`
- Bucket: `project-exception`
- Reason: Request body streams are read sequentially through `reader.read()`. The loop cannot be parallelized.
- Recheck when: body parsing changes away from a stream reader.

### Radix and shadcn compatibility wrappers

- Files:
  - `src/components/ui/accordion.tsx`
  - `src/components/ui/textarea.tsx`
  - `src/components/ui/separator.tsx`
  - `src/components/ui/badge.tsx`
- Rule: `no-react19-deprecated-apis`
- Bucket: `project-exception`
- Reason: These wrappers follow Radix/shadcn compatibility patterns. React 19 ref-as-prop migration should be handled as a dedicated compatibility wave, not score-chasing.
- Recheck when: Radix/shadcn guidance for React 19 changes or the project performs a UI primitive migration.
```

- [ ] **Step 2: Check the exception doc has all current exception files**

Run:

```bash
rg -n "json-ld-script|logo.tsx|layout.tsx|safe-parse-json|accordion.tsx" docs/quality/react-doctor-exceptions.md
```

Expected: output includes each exception file.

- [ ] **Step 3: Commit**

```bash
git add docs/quality/react-doctor-exceptions.md
git commit -m "docs: record react doctor exceptions"
```

---

### Task 3: Add a classifier test first

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/react-doctor-classify.test.ts`

- [ ] **Step 1: Write the failing classifier test**

Create `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/react-doctor-classify.test.ts` with this content:

```typescript
import { describe, expect, it } from "vitest";
import { classifyDiagnostics } from "../../../scripts/quality/react-doctor-classify.mjs";

const diagnostics = [
  {
    severity: "error",
    rule: "effect-needs-cleanup",
    category: "State & Effects",
    plugin: "react-doctor",
    filePath: "src/components/example.tsx",
    line: 12,
    message: "effect needs cleanup",
  },
  {
    severity: "warning",
    rule: "no-danger",
    category: "Correctness",
    plugin: "react",
    filePath: "src/components/seo/json-ld-script.tsx",
    line: 74,
    message: "Do not use dangerouslySetInnerHTML prop",
  },
  {
    severity: "warning",
    rule: "design-no-vague-button-label",
    category: "Accessibility",
    plugin: "react-doctor",
    filePath: "src/components/ui/__tests__/button.test.tsx",
    line: 171,
    message: "Vague button label",
  },
  {
    severity: "warning",
    rule: "async-await-in-loop",
    category: "Performance",
    plugin: "react-doctor",
    filePath: "src/lib/api/safe-parse-json.ts",
    line: 74,
    message: "await inside loop",
  },
  {
    severity: "warning",
    rule: "server-sequential-independent-await",
    category: "Server",
    plugin: "react-doctor",
    filePath: "src/app/[locale]/products/page.tsx",
    line: 68,
    message: "sequential await",
  },
  {
    severity: "warning",
    rule: "design-no-redundant-size-axes",
    category: "Architecture",
    plugin: "react-doctor",
    filePath: "src/components/sections/quality-section-view.tsx",
    line: 83,
    message: "h-10 w-10",
  },
  {
    severity: "warning",
    rule: "no-array-index-as-key",
    category: "Correctness",
    plugin: "react-doctor",
    filePath: "src/components/product-list.tsx",
    line: 24,
    message: "Array index used as React key",
  },
] as const;

describe("react doctor classifier", () => {
  it("classifies diagnostics into stable governance buckets", () => {
    const result = classifyDiagnostics(diagnostics);

    expect(result.summary.total).toBe(7);
    expect(result.byBucket["blocking-error"]).toBe(1);
    expect(result.byBucket["project-exception"]).toBe(2);
    expect(result.byBucket["test-fixture-noise"]).toBe(1);
    expect(result.byBucket["needs-manual-proof"]).toBe(1);
    expect(result.byBucket["low-value-style"]).toBe(1);
    expect(result.byBucket["confirmed-real"]).toBe(1);
  });

  it("keeps bucket entries traceable to file, rule, and line", () => {
    const result = classifyDiagnostics(diagnostics);
    const jsonLd = result.diagnostics.find(
      (diagnostic) => diagnostic.filePath === "src/components/seo/json-ld-script.tsx",
    );

    expect(jsonLd).toMatchObject({
      bucket: "project-exception",
      rule: "no-danger",
      line: 74,
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails because the classifier does not exist**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/react-doctor-classify.test.ts
```

Expected: FAIL with an import error for `scripts/quality/react-doctor-classify.mjs`.

- [ ] **Step 3: Commit only if your workflow allows red commits**

Do not commit this failing test unless the current branch policy allows red commits. If red commits are not allowed, continue to Task 4 and commit after green.

---

### Task 4: Implement the classifier

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/scripts/quality/react-doctor-classify.mjs`
- Test: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/react-doctor-classify.test.ts`

- [ ] **Step 1: Create the classifier script**

Create `/Users/Data/workspace/showcase-website-starter/scripts/quality/react-doctor-classify.mjs` with this content:

```javascript
import fs from "node:fs";
import path from "node:path";

const TEST_FILE_PATTERN =
  /(__tests__|\/test\/|\/testing\/|^tests\/|\.test\.|\.spec\.)/;

const LOW_VALUE_STYLE_RULES = new Set([
  "design-no-bold-heading",
  "design-no-default-tailwind-palette",
  "design-no-redundant-size-axes",
  "design-no-space-on-flex-children",
  "design-no-three-period-ellipsis",
  "no-generic-handler-names",
]);

const NEEDS_PROOF_RULES = new Set([
  "async-await-in-loop",
  "async-parallel",
  "nextjs-no-redirect-in-try-catch",
  "nextjs-no-use-search-params-without-suspense",
  "server-sequential-independent-await",
]);

const PROJECT_EXCEPTIONS = [
  {
    filePath: "src/components/seo/json-ld-script.tsx",
    rule: "no-danger",
    reason: "JSON-LD injection is centralized and escaped by generateJSONLD.",
  },
  {
    filePath: "src/components/layout/logo.tsx",
    rule: "nextjs-no-img-element",
    reason: "Local SVG logo intentionally avoids next/image runtime in shared layout.",
  },
  {
    filePath: "src/app/[locale]/layout.tsx",
    rule: "nextjs-no-native-script",
    reason: "Native scripts are development-only helper scripts.",
  },
  {
    filePath: "src/app/[locale]/[...rest]/page.tsx",
    rule: "nextjs-missing-metadata",
    reason: "Catch-all route only calls notFound for localized 404 behavior.",
  },
  {
    filePath: "src/lib/api/safe-parse-json.ts",
    rule: "async-await-in-loop",
    reason: "Request body stream reader must be read sequentially.",
  },
  {
    filePath: "src/components/ui/accordion.tsx",
    rule: "no-react19-deprecated-apis",
    reason: "Radix wrapper compatibility migration is a separate UI primitive wave.",
  },
  {
    filePath: "src/components/ui/textarea.tsx",
    rule: "no-react19-deprecated-apis",
    reason: "Radix/shadcn compatibility migration is a separate UI primitive wave.",
  },
  {
    filePath: "src/components/ui/separator.tsx",
    rule: "no-react19-deprecated-apis",
    reason: "Radix/shadcn compatibility migration is a separate UI primitive wave.",
  },
  {
    filePath: "src/components/ui/badge.tsx",
    rule: "no-react19-deprecated-apis",
    reason: "Radix/shadcn compatibility migration is a separate UI primitive wave.",
  },
  {
    filePath: "src/components/security/turnstile.tsx",
    rule: "no-prop-callback-in-effect",
    reason:
      "Turnstile availability callbacks bridge third-party widget state to the parent.",
  },
  {
    filePath: "src/components/security/turnstile.tsx",
    rule: "no-event-handler",
    reason:
      "Turnstile dev bypass and missing-site-key callbacks are external widget adapter events.",
  },
];

function isTestFile(filePath) {
  return TEST_FILE_PATTERN.test(filePath);
}

function findProjectException(diagnostic) {
  return PROJECT_EXCEPTIONS.find(
    (exception) =>
      exception.filePath === diagnostic.filePath &&
      exception.rule === diagnostic.rule,
  );
}

function classifyDiagnostic(diagnostic) {
  if (diagnostic.severity === "error") {
    return {
      bucket: "blocking-error",
      reason: "React Doctor error blocks CI.",
    };
  }

  const exception = findProjectException(diagnostic);
  if (exception) {
    return {
      bucket: "project-exception",
      reason: exception.reason,
    };
  }

  if (isTestFile(diagnostic.filePath)) {
    return {
      bucket: "test-fixture-noise",
      reason: "Diagnostic is in test or fixture code.",
    };
  }

  if (LOW_VALUE_STYLE_RULES.has(diagnostic.rule)) {
    return {
      bucket: "low-value-style",
      reason: "Style cleanup or low-risk readability suggestion.",
    };
  }

  if (NEEDS_PROOF_RULES.has(diagnostic.rule)) {
    return {
      bucket: "needs-manual-proof",
      reason: "Rule needs runtime, ordering, or framework proof before repair.",
    };
  }

  return {
    bucket: "confirmed-real",
    reason: "Production warning without a documented exception.",
  };
}

export function classifyDiagnostics(diagnostics) {
  const classifiedDiagnostics = diagnostics.map((diagnostic) => {
    const classification = classifyDiagnostic(diagnostic);
    return {
      ...diagnostic,
      bucket: classification.bucket,
      bucketReason: classification.reason,
    };
  });

  const byBucket = Object.create(null);
  const byRule = Object.create(null);
  const byScope = Object.create(null);

  for (const diagnostic of classifiedDiagnostics) {
    byBucket[diagnostic.bucket] = (byBucket[diagnostic.bucket] ?? 0) + 1;
    byRule[diagnostic.rule] = (byRule[diagnostic.rule] ?? 0) + 1;
    const scope = isTestFile(diagnostic.filePath)
      ? "tests"
      : diagnostic.filePath.startsWith("scripts/")
        ? "scripts"
        : "production";
    byScope[scope] = (byScope[scope] ?? 0) + 1;
  }

  return {
    summary: {
      total: classifiedDiagnostics.length,
      errors: classifiedDiagnostics.filter(
        (diagnostic) => diagnostic.severity === "error",
      ).length,
      warnings: classifiedDiagnostics.filter(
        (diagnostic) => diagnostic.severity === "warning",
      ).length,
    },
    byBucket,
    byRule,
    byScope,
    diagnostics: classifiedDiagnostics,
  };
}

function loadReport(reportPath) {
  return JSON.parse(fs.readFileSync(reportPath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reportPath = process.argv[2];
  const outputPath =
    process.argv[3] ?? "reports/quality/react-doctor-classified.json";

  if (!reportPath) {
    console.error(
      "Usage: node scripts/quality/react-doctor-classify.mjs <react-doctor-report.json> [output.json]",
    );
    process.exit(2);
  }

  const report = loadReport(reportPath);
  const diagnostics = report.projects?.[0]?.diagnostics ?? [];
  const result = classifyDiagnostics(diagnostics);
  writeJson(outputPath, result);
  console.log(
    `[react-doctor-classify] wrote ${outputPath} with ${result.summary.total} diagnostics`,
  );
}
```

- [ ] **Step 2: Run the focused classifier test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/react-doctor-classify.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 3: Run lint on the new script and test**

Run:

```bash
pnpm lint:check
```

Expected: PASS with `[eslint-disable-check] OK`.

- [ ] **Step 4: Commit**

```bash
git add scripts/quality/react-doctor-classify.mjs tests/unit/scripts/react-doctor-classify.test.ts
git commit -m "chore: classify react doctor warnings"
```

---

### Task 5: Add a non-blocking analysis script

> **Historical/superseded note:** The `react:doctor:classify` command examples
> in this task are from the old warning-governance design. After W1-2, this is
> not a current package script or execution command; use
> `pnpm react:doctor:report` for a manual JSON report.

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/package.json`
- Test: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`

- [ ] **Step 1: Update the proof command surface test first**

In `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/proof-lane-contract.test.ts`, extend the expected script map inside `keeps the canonical starter proof command surface` with:

```typescript
"react:doctor:classify": "node scripts/quality/react-doctor-classify.mjs /tmp/showcase-react-doctor-current.json reports/quality/react-doctor-classified.json",
```

Then update the script count from 17 to 18:

```typescript
expect(Object.keys(scripts)).toHaveLength(18);
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: FAIL because `react:doctor:classify` is not in `package.json`.

- [ ] **Step 3: Add the package script**

In `/Users/Data/workspace/showcase-website-starter/package.json`, add this script next to the existing React Doctor scripts:

```json
"react:doctor:classify": "node scripts/quality/react-doctor-classify.mjs /tmp/showcase-react-doctor-current.json reports/quality/react-doctor-classified.json"
```

Do not change:

```json
"react:doctor": "react-doctor . --offline --fail-on error"
```

- [ ] **Step 4: Run the proof command surface test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Generate a fresh report and classify it**

Run:

```bash
pnpm exec react-doctor . --offline --json --fail-on none > /tmp/showcase-react-doctor-current.json
pnpm react:doctor:classify
```

Expected:

```text
[react-doctor-classify] wrote reports/quality/react-doctor-classified.json with 516 diagnostics
```

- [ ] **Step 6: Keep generated output out of the commit unless a policy decision says otherwise**

Run:

```bash
git status --short --untracked-files=all
```

Expected: `reports/quality/react-doctor-classified.json` is ignored with the rest of `reports/`, or untracked and left unstaged.

- [ ] **Step 7: Commit script wiring**

```bash
git add package.json tests/unit/scripts/proof-lane-contract.test.ts
git commit -m "chore: add react doctor classification script"
```

---

### Task 6: Link policy docs from baseline and quality proof

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-baseline.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`
- Test: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/warning-baseline-contract.test.ts`

- [ ] **Step 1: Extend the warning baseline contract test**

In `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/warning-baseline-contract.test.ts`, add checks that the docs mention React Doctor policy and exceptions:

```typescript
expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
  "docs/quality/react-doctor-policy.md",
);
expect(readRepoFile("docs/quality/react-doctor-baseline.md")).toContain(
  "docs/quality/react-doctor-exceptions.md",
);
expect(qualityProof).toContain("React Doctor");
expect(qualityProof).toContain("error blocks CI");
expect(qualityProof).toContain("warning is backlog");
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/warning-baseline-contract.test.ts
```

Expected: FAIL because the docs are not linked yet.

- [ ] **Step 3: Update the baseline doc**

Add this section to `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-baseline.md`:

```markdown
## Policy files

- Policy: `docs/quality/react-doctor-policy.md`
- Exceptions: `docs/quality/react-doctor-exceptions.md`

The current baseline is a warning backlog. It is not a release blocker and it is not a count of real production bugs.
```

- [ ] **Step 4: Update the quality proof doc**

In `/Users/Data/workspace/showcase-website-starter/docs/website/quality-proof.md`, add this paragraph near the local quality gate section:

```markdown
React Doctor runs as an error-level quality gate. `error` blocks CI; `warning` is backlog. React Doctor warnings are classified under `docs/quality/react-doctor-policy.md` and known project exceptions are recorded in `docs/quality/react-doctor-exceptions.md`. Do not treat the warning count as a count of real production bugs.
```

- [ ] **Step 5: Run the focused docs test**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/warning-baseline-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/quality/react-doctor-baseline.md docs/quality/react-doctor-policy.md docs/quality/react-doctor-exceptions.md docs/website/quality-proof.md tests/unit/scripts/warning-baseline-contract.test.ts
git commit -m "docs: link react doctor warning governance"
```

---

### Task 7: Production state and effect proof lane

**Files:**
- Modify only after proof:
  - `/Users/Data/workspace/showcase-website-starter/src/components/security/turnstile.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/ui/theme-switcher.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/cookie/cookie-banner.tsx`
  - paired tests under each component's `__tests__` directory

- [ ] **Step 1: Generate a focused list from the classified report**

Run:

```bash
jq -r '.diagnostics[] | select(.category == "State & Effects") | [.bucket, .rule, .filePath, .line, .message] | @tsv' reports/quality/react-doctor-classified.json
```

Expected: output includes Turnstile, theme switcher, cookie banner, and any test-only entries.

- [ ] **Step 2: Pick only production entries**

Use this manual shortlist:

```text
src/components/security/turnstile.tsx
src/components/ui/theme-switcher.tsx
src/components/cookie/cookie-banner.tsx
src/components/layout/header-language-menu.tsx
```

- [ ] **Step 3: For Turnstile, write or update tests before changing code**

Run current tests first:

```bash
pnpm exec vitest run src/components/security/__tests__/turnstile.test.tsx
```

Expected: PASS before changes.

If a behavior change is needed, add tests that prove:

```text
Given dev bypass mode is enabled
When Turnstile renders once
Then onSuccess receives TURNSTILE_BYPASS_TOKEN once

Given no site key and no bypass mode
When Turnstile renders in non-test mode
Then onError receives the missing key message once
```

- [ ] **Step 4: Only then refactor the smallest state/effect issue**

Allowed refactor shape:

```typescript
const didNotifyMissingKeyRef = useRef(false);

useEffect(() => {
  if (siteKey || isBypassMode || isTestMode || didNotifyMissingKeyRef.current) {
    return;
  }
  didNotifyMissingKeyRef.current = true;
  logger.warn("Turnstile site key not configured. Bot protection is disabled.");
  onError?.("Turnstile site key not configured");
}, [siteKey, isBypassMode, isTestMode, onError]);
```

Do not move this into a global Provider unless the tests prove a real shared-state problem.

- [ ] **Step 5: Verify the focused lane**

Run:

```bash
pnpm exec vitest run src/components/security/__tests__/turnstile.test.tsx src/components/ui/__tests__/theme-switcher.test.tsx src/components/cookie/__tests__/cookie-banner.test.tsx
pnpm react:doctor
pnpm lint:check
pnpm type-check
```

Expected:

- focused tests pass
- React Doctor exits 0
- warning count may decrease, but it does not need to be zero
- lint and type-check pass

- [ ] **Step 6: Commit**

```bash
git add src/components/security/turnstile.tsx src/components/security/__tests__/turnstile.test.tsx src/components/ui/theme-switcher.tsx src/components/ui/__tests__/theme-switcher.test.tsx src/components/cookie/cookie-banner.tsx src/components/cookie/__tests__/cookie-banner.test.tsx
git commit -m "fix: tighten react doctor state warnings"
```

---

### Task 8: Production server sequencing proof lane

**Files:**
- Modify only after proof:
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/page.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/custom-project-support/page.tsx`
  - related page tests

- [ ] **Step 1: List production server sequencing warnings**

Run:

```bash
awk -F '\t' '$1=="server-sequential-independent-await" {print $4 ":" $5 " | " $6}' /tmp/showcase-react-doctor-current.tsv | sed -n '1,20p'
```

Expected: output includes `products/page.tsx`, `custom-project-support/page.tsx`, and script/test files.

- [ ] **Step 2: Confirm each page call has no data dependency**

Read the two files:

```bash
nl -ba 'src/app/[locale]/products/page.tsx' | sed -n '60,75p'
nl -ba 'src/app/[locale]/custom-project-support/page.tsx' | sed -n '203,213p'
```

Expected:

- `getTranslations` does not use data from the JSON-LD/content call.
- JSON-LD/content call does not use data from `getTranslations`.

- [ ] **Step 3: Write focused tests if the current tests do not cover rendering**

For products:

```bash
pnpm exec vitest run src/app/[locale]/products/__tests__/page.test.tsx src/app/[locale]/products/__tests__/products-page.test.tsx
```

For custom support:

```bash
pnpm exec vitest run src/app/[locale]/custom-project-support/__tests__/page.test.tsx
```

Expected: PASS before changes.

- [ ] **Step 4: Refactor only independent awaits**

For `src/app/[locale]/products/page.tsx`, replace:

```typescript
const t = await getTranslations({ locale, namespace: "catalog" });
const breadcrumbSchema = await buildCatalogBreadcrumbJsonLd({});
```

with:

```typescript
const [t, breadcrumbSchema] = await Promise.all([
  getTranslations({ locale, namespace: "catalog" }),
  buildCatalogBreadcrumbJsonLd({}),
]);
```

For `src/app/[locale]/custom-project-support/page.tsx`, replace:

```typescript
const t = await getTranslations({ locale, namespace: "customProject" });
const page = await getPageBySlug("custom-project-support", locale as Locale);
```

with:

```typescript
const [t, page] = await Promise.all([
  getTranslations({ locale, namespace: "customProject" }),
  getPageBySlug("custom-project-support", locale as Locale),
]);
```

- [ ] **Step 5: Verify page behavior**

Run:

```bash
pnpm exec vitest run src/app/[locale]/products/__tests__/page.test.tsx src/app/[locale]/products/__tests__/products-page.test.tsx src/app/[locale]/custom-project-support/__tests__/page.test.tsx
pnpm type-check
pnpm react:doctor
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/[locale]/products/page.tsx' 'src/app/[locale]/custom-project-support/page.tsx'
git commit -m "perf: parallelize independent page data reads"
```

---

### Task 9: Low-risk production style cleanup wave

**Files:**
- Modify selected production files only:
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/quality-section-view.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/sections/hero-section-view.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/layout/header-client.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/cookie/cookie-banner.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/forms/contact-form-fields.tsx`

- [ ] **Step 1: Build the exact candidate list**

Run:

```bash
awk -F '\t' '$1=="design-no-redundant-size-axes" && $4 !~ /(__tests__|\\/test\\/|\\/testing\\/|^tests\\/|\\.test\\.|\\.spec\\.)/ {print $4 ":" $5 " | " $6}' /tmp/showcase-react-doctor-current.tsv | sed -n '1,60p'
```

Expected: output includes `h-* w-*` pairs in production component files.

- [ ] **Step 2: Change only equal-axis Tailwind pairs**

Allowed replacements:

```text
h-10 w-10 -> size-10
h-8 w-8 -> size-8
h-6 w-6 -> size-6
h-5 w-5 -> size-5
h-4 w-4 -> size-4
h-3.5 w-3.5 -> size-3.5
h-2.5 w-2.5 -> size-2.5
h-2 w-2 -> size-2
```

Do not change unequal axes, spacing, colors, typography, tokens, or layout behavior in this wave.

- [ ] **Step 3: Run focused component tests**

Run:

```bash
pnpm exec vitest run src/components/sections/__tests__/quality-section.test.tsx src/components/sections/__tests__/hero-section.test.tsx src/components/layout/__tests__/header-client.test.tsx src/components/cookie/__tests__/cookie-banner.test.tsx src/components/forms/__tests__/contact-form-fields.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Run project checks**

Run:

```bash
pnpm lint:check
pnpm type-check
pnpm react:doctor
```

Expected: all pass. React Doctor warning count should drop, but exact count is not the success condition.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/quality-section-view.tsx src/components/sections/hero-section-view.tsx src/components/layout/header-client.tsx src/components/cookie/cookie-banner.tsx src/components/forms/contact-form-fields.tsx
git commit -m "style: use tailwind size shorthand in production components"
```

---

### Task 10: Next.js project-exception review lane

**Files:**
- Modify docs first:
  - `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-exceptions.md`
- Modify source only if proof shows the exception is wrong:
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/[...rest]/page.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/layout.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/monitoring/enterprise-analytics-island.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/blog/[slug]/page.tsx`

- [ ] **Step 1: Capture current Next.js warnings**

Run:

```bash
awk -F '\t' '$2=="Next.js" {print $1 "\t" $4 ":" $5 " | " $6}' /tmp/showcase-react-doctor-current.tsv
```

Expected: output includes metadata, native script, useSearchParams, redirect/notFound, image/link rules.

- [ ] **Step 2: Prove the Suspense boundary for analytics**

Read:

```bash
nl -ba src/components/cookie/cookie-consent-island.tsx | sed -n '25,40p'
nl -ba src/components/monitoring/enterprise-analytics-island.tsx | sed -n '28,35p'
```

Expected:

- `EnterpriseAnalyticsIsland` calls `useSearchParams`.
- The island is rendered under `<Suspense fallback={null}>`.

If this remains true, keep it as `project-exception`.

- [ ] **Step 3: Prove dev-only script boundary**

Read:

```bash
nl -ba 'src/app/[locale]/layout.tsx' | sed -n '150,188p'
```

Expected: dev scripts are gated by `NODE_ENV === "development"`.

If true, keep it as `project-exception`.

- [ ] **Step 4: Decide whether blog notFound needs repair**

Read:

```bash
nl -ba 'src/app/[locale]/blog/[slug]/page.tsx' | sed -n '28,34p'
```

If `notFound()` stays only in the `catch` branch, document the warning as `needs-manual-proof`. If a future refactor moves `notFound()` into a broader `try`, add a focused test and repair.

- [ ] **Step 5: Commit documentation updates only**

```bash
git add docs/quality/react-doctor-exceptions.md
git commit -m "docs: review nextjs react doctor exceptions"
```

---

### Task 11: Test fixture noise cleanup wave

**Files:**
- Modify selected test files only after production waves:
  - `/Users/Data/workspace/showcase-website-starter/src/components/ui/__tests__/label-events.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/ui/__tests__/button.test.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/layout/__tests__/language-switcher/setup.tsx`
  - `/Users/Data/workspace/showcase-website-starter/src/components/ui/__tests__/input-props-events.test.tsx`

- [ ] **Step 1: Confirm test fixture noise still dominates**

Run:

```bash
pnpm exec react-doctor . --offline --json --fail-on none > /tmp/showcase-react-doctor-current.json
jq '[.projects[0].diagnostics[] | select(.filePath | test("(__tests__|/test/|/testing/|^tests/|\\\\.test\\\\.|\\\\.spec\\\\.)"))] | length' /tmp/showcase-react-doctor-current.json
```

Expected: number is still larger than production warnings.

- [ ] **Step 2: Fix only fixture semantics that improve readability**

Allowed changes:

```text
handleClick -> selectLabelFixture
handleFocus -> focusLabelFixture
handleBlur -> blurLabelFixture
"Submit" -> "Send message" in form-like fixtures
<div onClick={...}> -> <button type="button" onClick={...}> when the test does not need a div
```

Do not rewrite tests around React Doctor score.

- [ ] **Step 3: Run focused tests**

Run:

```bash
pnpm exec vitest run src/components/ui/__tests__/label-events.test.tsx src/components/ui/__tests__/button.test.tsx src/components/layout/__tests__/mobile-navigation.test.tsx src/components/ui/__tests__/input-props-events.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Run broad tests only if fixture helpers changed**

If shared fixture helpers changed, run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/__tests__/label-events.test.tsx src/components/ui/__tests__/button.test.tsx src/components/layout/__tests__/language-switcher/setup.tsx src/components/ui/__tests__/input-props-events.test.tsx
git commit -m "test: reduce react doctor fixture noise"
```

---

### Task 12: Gate upgrade decision

> **Historical/superseded note:** The `react:doctor:classify` command examples
> below belong to the old warning-governance design. After W1-2, classification
> is manual backlog/reference work, not a CI gate.

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md`
- Modify only if criteria are met: `/Users/Data/workspace/showcase-website-starter/package.json`
- Modify only if criteria are met: `/Users/Data/workspace/showcase-website-starter/.github/workflows/ci.yml`

- [ ] **Step 1: Generate a final classified report**

Run:

```bash
pnpm exec react-doctor . --offline --json --fail-on none > /tmp/showcase-react-doctor-current.json
pnpm react:doctor:classify
jq '.byBucket' reports/quality/react-doctor-classified.json
```

Expected: bucket counts are visible.

- [ ] **Step 2: Apply gate criteria**

Do not upgrade warning gates unless all are true:

```text
blocking-error = 0
confirmed-real <= 10
needs-manual-proof entries all have owners or docs
project-exception entries are documented
test-fixture-noise is excluded from release blocking
pnpm react:doctor runtime is stable in CI
```

- [ ] **Step 3: If criteria fail, keep current gate and document why**

Add this line to `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md`:

```markdown
Warning-level CI blocking is deferred until `confirmed-real <= 10`, all project exceptions are documented, and test fixture noise is excluded from release blocking.
```

Then commit:

```bash
git add docs/quality/react-doctor-policy.md
git commit -m "docs: defer react doctor warning gate"
```

- [ ] **Step 4: If criteria pass, propose a narrow gate instead of `--fail-on warning`**

Do not change `pnpm react:doctor` to `--fail-on warning`.

Instead, add a separate script that fails only on classified production `confirmed-real` warnings:

```json
"react:doctor:classified-gate": "node scripts/quality/react-doctor-classified-gate.mjs reports/quality/react-doctor-classified.json"
```

This script must be planned and tested in a separate branch. It is not part of the first governance wave.

---

## Phase 2: Continue production warning governance

Phase 2 keeps the same long-term policy:

- do not upgrade the CI gate to raw `--fail-on warning`
- do not treat all warnings as bugs
- repair production `confirmed-real` warnings in small proof-backed waves
- leave skeleton placeholders, decorative grid arrays, email text line splitting, and test fixture noise out of this wave
- keep each wave narrow enough that React Doctor, focused tests, lint, and type-check can explain the change

Phase 2 wave A verified baseline:

```text
errorCount: 0
warningCount: 463
affectedFileCount: 167
score: 69 / 100
confirmed-real: 67
```

### Task 13: Production correctness wave A - stable homepage preview key

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/page.tsx`
- Test: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/__tests__/page.test.tsx`

**Scope:**

Only fix the homepage hero preview `no-array-index-as-key` warning. Do not change loading skeleton keys, decorative grid crosshair keys, or email line keys in this task.

- [ ] **Step 1: Add a focused behavior test for the existing preview list**

In `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/__tests__/page.test.tsx`, add this assertion to the existing homepage rendering test:

```typescript
expect(screen.getByText("Home, Products, Blog, About, and Contact")).toBeInTheDocument();
expect(screen.getByText("Brand and content replacement surfaces")).toBeInTheDocument();
expect(screen.getByText("Inquiry path with anti-abuse basics")).toBeInTheDocument();
expect(screen.getByText("Cloudflare-ready deployment direction")).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test before implementation**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/__tests__/page.test.tsx'
```

Expected: PASS. This is a characterization test that protects buyer-visible copy while the internal key changes.

- [ ] **Step 3: Replace the index key with stable preview item metadata**

In `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/page.tsx`, replace:

```typescript
{[0, 1, 2, 3].map((index) => (
  <li
    key={index}
    className="rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium"
  >
    {t(`hero.preview.items.${index}`)}
  </li>
))}
```

with stable metadata:

```typescript
const HERO_PREVIEW_ITEMS = [
  { key: "page-structure", messageIndex: 0 },
  { key: "replacement-surface", messageIndex: 1 },
  { key: "inquiry-path", messageIndex: 2 },
  { key: "cloudflare-launch", messageIndex: 3 },
] as const;
```

and:

```typescript
{HERO_PREVIEW_ITEMS.map((item) => (
  <li
    key={item.key}
    className="rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium"
  >
    {t(`hero.preview.items.${item.messageIndex}`)}
  </li>
))}
```

- [ ] **Step 4: Verify the focused page test**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/__tests__/page.test.tsx'
```

Expected: PASS.

### Task 14: Production accessibility wave A - cookie preference labels

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/cookie/cookie-banner.tsx`
- Test: `/Users/Data/workspace/showcase-website-starter/src/components/cookie/__tests__/cookie-banner.test.tsx`

**Scope:**

Only fix the `label-has-associated-control` warning in cookie category toggles. Do not change cookie copy, translation keys, preference state, focus trap, or button behavior. Do not use `aria-label` as a shortcut because it can hide whether the visible text is actually connected to the checkbox.

- [ ] **Step 1: Add an accessibility behavior test**

In `/Users/Data/workspace/showcase-website-starter/src/components/cookie/__tests__/cookie-banner.test.tsx`, add a test under the `accessibility` block:

```typescript
it("associates cookie category labels with their checkboxes", () => {
  render(<CookieBanner />);

  fireEvent.click(screen.getByRole("button", { name: "Manage" }));

  expect(screen.getByLabelText("Necessary")).toBeDisabled();
  expect(screen.getByLabelText("Analytics")).not.toBeChecked();
  expect(screen.getByLabelText("Marketing")).not.toBeChecked();
});
```

- [ ] **Step 2: Run the focused test before implementation**

Run:

```bash
pnpm exec vitest run src/components/cookie/__tests__/cookie-banner.test.tsx
```

Expected: PASS or FAIL only if the label association is already broken. Continue only after the test proves the current behavior.

- [ ] **Step 3: Connect the checkbox to visible text with explicit IDs**

In `/Users/Data/workspace/showcase-website-starter/src/components/cookie/cookie-banner.tsx`, keep the existing `id` and add visible-text IDs:

```typescript
const labelId = `${id}-label`;
const descriptionId = `${id}-description`;
```

Render the checkbox with explicit visible-text associations while keeping the wrapping label so the whole category card remains clickable:

```tsx
<label className={cn(...)}>
  <input
    id={id}
    type="checkbox"
    checked={checked}
    disabled={disabled}
    onChange={(e) => onChange?.(e.target.checked)}
    aria-labelledby={labelId}
    aria-describedby={descriptionId}
    className="mt-0.5 size-4 rounded border-input accent-primary disabled:cursor-not-allowed disabled:opacity-50"
  />
  <span className="flex-1 space-y-0.5">
    <span
      id={labelId}
      className="block text-xs leading-none font-medium text-foreground"
    >
      {label}
    </span>
    <span
      id={descriptionId}
      className="block text-xs text-muted-foreground"
    >
      {description}
    </span>
  </span>
</label>
```

This keeps the accessible name tied to visible text, avoids `aria-label` drift, preserves the full-card click target, and satisfies React Doctor where the original dynamic wrapping label was still reported as lacking accessible text.

- [ ] **Step 4: Verify cookie behavior**

Run:

```bash
pnpm exec vitest run src/components/cookie/__tests__/cookie-banner.test.tsx
```

Expected: PASS.

### Task 15: Production form render helper wave A

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/forms/contact-form-fields.tsx`
- Test: `/Users/Data/workspace/showcase-website-starter/src/components/forms/__tests__/contact-form-fields.test.tsx`
- Test: `/Users/Data/workspace/showcase-website-starter/src/components/forms/__tests__/contact-form-fields-core.test.tsx`

**Scope:**

Only move pure render helpers out of the `FormFields` component. Do not change form fields, field names, translation keys, required flags, placeholders, or submission semantics.

- [ ] **Step 1: Add behavior tests for optional marker and placeholders**

In `/Users/Data/workspace/showcase-website-starter/src/components/forms/__tests__/contact-form-fields.test.tsx`, import `FormFields` and add tests that render the full component:

```typescript
it("renders optional markers for optional configured fields", () => {
  render(<FormFields {...defaultProps} />);

  expect(screen.getByText("optional")).toBeInTheDocument();
  expect(screen.getByLabelText(/company/i)).not.toHaveAttribute("required");
});

it("keeps translated placeholders on configured fields", () => {
  render(<FormFields {...defaultProps} />);

  expect(screen.getByLabelText(/email/i)).toHaveAttribute("placeholder", "emailPlaceholder");
  expect(screen.getByLabelText(/message/i)).toHaveAttribute("placeholder", "messagePlaceholder");
});
```

- [ ] **Step 2: Run the focused form tests before implementation**

Run:

```bash
pnpm exec vitest run src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-fields-core.test.tsx
```

Expected: PASS. These are characterization tests for visible labels, placeholders, and form semantics.

- [ ] **Step 3: Move pure helpers out of the component**

In `/Users/Data/workspace/showcase-website-starter/src/components/forms/contact-form-fields.tsx`, move these helper definitions above `FormFields`:

```typescript
function getFieldLabelClass(field: ContactFormFieldDescriptor): string {
  return ["text-sm", field.required ? FORM_FIELD_REQUIRED_CLASS_NAME : ""]
    .filter(Boolean)
    .join(" ");
}

function getFieldPlaceholder(
  field: ContactFormFieldDescriptor,
  t: (key: string) => string,
): string | undefined {
  return field.placeholderKey ? t(field.placeholderKey) : undefined;
}
```

Then replace component-local calls:

```typescript
renderLabelClass(field)
renderPlaceholder(field)
```

with:

```typescript
getFieldLabelClass(field)
getFieldPlaceholder(field, t)
```

- [ ] **Step 4: Verify form behavior**

Run:

```bash
pnpm exec vitest run src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-fields-core.test.tsx
```

Expected: PASS.

### Task 16: Phase 2 wave A verification and baseline refresh

**Files:**
- Modify only if counts changed: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-baseline.md`
- Generated and not committed: `/tmp/showcase-react-doctor-current.json`
- Generated and ignored: `/Users/Data/workspace/showcase-website-starter/reports/quality/react-doctor-classified.json`

- [ ] **Step 1: Run focused verification**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/__tests__/page.test.tsx' src/components/cookie/__tests__/cookie-banner.test.tsx src/components/forms/__tests__/contact-form-fields.test.tsx src/components/forms/__tests__/contact-form-fields-core.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run project quality gates**

Run:

```bash
pnpm lint:check
pnpm type-check
pnpm react:doctor
```

Expected:

- lint passes
- type-check passes
- React Doctor exits 0
- warning count decreases or stays within the expected backlog shape

- [ ] **Step 3: Refresh classified report**

Run:

```bash
pnpm exec react-doctor . --offline --json --fail-on none > /tmp/showcase-react-doctor-current.json
pnpm react:doctor:classify
jq '.summary, .byBucket' reports/quality/react-doctor-classified.json
```

Expected:

- `errors` remains 0
- `confirmed-real` decreases for fixed production warnings
- raw warning gate remains non-blocking

- [ ] **Step 4: Do not upgrade the warning gate**

Confirm that `/Users/Data/workspace/showcase-website-starter/package.json` still contains:

```json
"react:doctor": "react-doctor . --offline --fail-on error"
```

Do not change it to `--fail-on warning`.

---

## Phase 3: Production signal refinement wave B

### Task 17: Production render memo wave B - stable default arrays

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/grid/grid-frame.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/grid/grid-section.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/grid/grid-system.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/layout/header.tsx`
- Test: `/Users/Data/workspace/showcase-website-starter/src/components/grid/__tests__/grid-frame.test.tsx`
- Test: `/Users/Data/workspace/showcase-website-starter/src/components/grid/__tests__/grid-section.test.tsx`
- Test: `/Users/Data/workspace/showcase-website-starter/src/components/grid/__tests__/grid-system.test.tsx`
- Test: `/Users/Data/workspace/showcase-website-starter/src/components/layout/__tests__/header.test.tsx`

**Scope:**

Only fix `rerender-memo-with-default-value` warnings by replacing default `[]`
parameter values with stable module-level empty arrays. Do not change grid
visuals, header navigation items, responsive behavior, or mobile/language
islands.

- [x] **Step 1: Characterize existing behavior**

Run:

```bash
pnpm exec vitest run src/components/grid/__tests__/grid-frame.test.tsx src/components/grid/__tests__/grid-section.test.tsx src/components/grid/__tests__/grid-system.test.tsx src/components/layout/__tests__/header.test.tsx
```

Expected: PASS.

- [x] **Step 2: Replace default empty arrays with stable constants**

Use module-level constants for empty crosshairs, guides, and main nav items.

- [x] **Step 3: Add a small default behavior test**

Add a `GridSection` test proving no decorative guide cells render when guides
are not provided.

- [x] **Step 4: Verify wave B behavior**

Latest focused run passed 4 files and 37 tests.

### Task 18: Lazy island state false-positive classification

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/quality/react-doctor-classify.mjs`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/react-doctor-classify.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-exceptions.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-baseline.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md`

**Scope:**

Do not change lazy island implementation. The `rerender-state-only-in-handlers`
findings in these files are false positives because the state is read by
early-return/render gates and changing it to `ref` would break lazy mount:

- `src/components/cookie/lazy-cookie-consent-island.tsx`
- `src/components/ui/lazy-theme-switcher.tsx`
- `src/components/layout/header-client.tsx`

- [x] **Step 1: Run independent read-only review**

A reviewer subagent confirmed all five findings are false positives and do not
need extra behavior tests. Existing tests prove idle-before/after rendering and
click-before/after lazy activation.

- [x] **Step 2: Classify these findings as project exceptions**

Add file/rule exceptions for `rerender-state-only-in-handlers` in the
classifier, with a regression test.

- [x] **Step 3: Record exception proof**

Document why ref conversion would break the render trigger in
`docs/quality/react-doctor-exceptions.md`.

- [x] **Step 4: Refresh current baseline**

Latest classified baseline after wave B:

```text
total: 459
errors: 0
warnings: 459
test-fixture-noise: 301
low-value-style: 83
confirmed-real: 15
project-exception: 21
needs-manual-proof: 39
```

### Task 19: Production confirmed-real closure wave C

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/playwright.config.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/mdx-components.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/app/[locale]/products/[market]/page.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/components/sections/hero-section.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/contact-form-config.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/cors.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/security.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/config/single-site-page-expression.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/content-parser.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/cookie-consent/context.tsx`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/security/turnstile-config.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/quality/react-doctor-classify.mjs`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/react-doctor-classify.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-exceptions.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-baseline.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md`

**Scope:**

Close the remaining production `confirmed-real` bucket without changing CI to
raw warning blocking. Only apply small behavior-preserving refactors and record
proof-heavy findings as proof lanes or exceptions.

- [x] **Step 1: Fix low-risk iteration findings**

Replace local `map().filter()` / `filter().map()` / `map().filter(Boolean)`
patterns with single-pass loops or `flatMap()` where tests cover the behavior:

- hero proof item view model
- market family navigation view model
- contact form field descriptors
- CSP directive serialization
- standard market slug filtering
- content file filtering
- Playwright locale parsing
- CORS origin parsing
- Turnstile host/action parsing

- [x] **Step 2: Keep sanitizer string scans in a proof lane**

Classify `src/lib/security-validation.ts` `js-set-map-lookups` as
`needs-manual-proof`. The reported code is `String.indexOf()` inside an HTML
sanitizer tag-stripping loop, not array membership. Rewriting needs sanitizer
security proof.

- [x] **Step 3: Apply small React 19 and MDX cleanup**

- Migrate cookie consent context reads from `useContext()` to React 19 `use()`.
- Replace the MDX blockquote thick left border with a tokenized subtle quote
  box.

- [x] **Step 4: Keep Turnstile loading state as an exception**

Classify `src/components/security/turnstile.tsx`
`rendering-usetransition-loading` as a project exception because the loading
state mirrors an external Cloudflare widget lifecycle, not a React transition.

- [x] **Step 5: Refresh current classified baseline**

Latest classified baseline after wave C:

```text
total: 447
errors: 0
warnings: 447
test-fixture-noise: 301
low-value-style: 83
confirmed-real: 0
project-exception: 22
needs-manual-proof: 41
```

### Task 20: Scripts proof lane and classifier calibration wave D

**Files:**
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/starter-checks.js`
- Modify: `/Users/Data/workspace/showcase-website-starter/scripts/quality/react-doctor-classify.mjs`
- Modify: `/Users/Data/workspace/showcase-website-starter/tests/unit/scripts/react-doctor-classify.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-baseline.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-exceptions.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md`

**Scope:**

Only clean low-risk `scripts/starter-checks.js` findings that have focused
script tests or direct guardrail commands. Do not parallelize Cloudflare smoke
or deploy probes. Do not rewrite sanitizer internals.

- [x] **Step 1: Clean low-risk parser and list transformations**

Replaced local `map().filter(Boolean)`, `filter().map()`, repeated component
governance filters, and immutable sort patterns in the quality script where
tests or generated-output hashes could prove the behavior stayed stable.

- [x] **Step 2: Verify script behavior**

Focused verification passed:

```text
tests/unit/scripts/content-slug-sync.test.ts
tests/unit/scripts/mdx-slug-sync.test.ts
tests/unit/scripts/check-eslint-disable-usage.test.ts
tests/unit/scripts/client-boundary-budget.test.ts
tests/unit/scripts/component-governance-check.test.ts
tests/architecture/component-governance.test.ts
tests/unit/scripts/proof-lane-contract.test.ts
```

Direct guardrail commands passed:

```text
node scripts/starter-checks.js content-slugs --quiet
node scripts/starter-checks.js eslint-disable
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js component-governance
node scripts/starter-checks.js client-boundary
```

`content-manifest` regenerated byte-identical outputs for:

```text
reports/content-manifest.json
src/lib/mdx-importers.generated.ts
src/lib/content-manifest.generated.ts
```

- [x] **Step 3: Classify remaining quality script warnings**

Remaining `scripts/starter-checks.js` warnings are not treated as confirmed
bugs:

- `js-set-map-lookups`: React Doctor is reporting `String.indexOf()` and
  `String.includes()` over file contents, docs, workflow snippets, and response
  bodies as if they were array lookup loops.
- async/sequential await rules: Cloudflare smoke and deployed-smoke probes
  intentionally preserve request order, retry timing, shared retry-event
  reporting, and readable failure logs.

- [x] **Step 4: Keep sanitizer scans as the only proof lane**

The only remaining `needs-manual-proof` warnings are:

```text
src/lib/security-validation.ts js-set-map-lookups x2
```

They stay in a security proof lane because `stripTag()` scans strings inside an
HTML sanitizer. Rewriting needs focused sanitizer cases for nested tags, missing
closing tags, mixed casing, and attacker-controlled payloads.

- [x] **Step 5: Refresh current classified baseline**

Latest classified baseline after wave D:

```text
total: 428
errors: 0
warnings: 428
test-fixture-noise: 301
low-value-style: 83
confirmed-real: 0
project-exception: 42
needs-manual-proof: 2
score: 72 / 100
```

### Task 21: Security proof lane and native zero-warning calibration

> **Historical/superseded note:** This task describes the old
> raw-governance layer. W1-2 removes that layer. Mentions of
> `react-doctor-raw-governance`, `react:doctor:governance`, and
> `react:doctor:raw-governance` below are historical only, not current commands.

**Files:**
- Create: `/Users/Data/workspace/showcase-website-starter/react-doctor.config.json`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/security-validation.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/src/lib/__tests__/security-validation.test.ts`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-baseline.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-policy.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/docs/quality/react-doctor-exceptions.md`
- Modify: `/Users/Data/workspace/showcase-website-starter/package.json`
- Modify: `/Users/Data/workspace/showcase-website-starter/.github/workflows/ci.yml`
- Create: `/Users/Data/workspace/showcase-website-starter/scripts/quality/react-doctor-raw-governance.mjs`

**Scope:**

Reach native React Doctor `0 warning / 0 error` without broad warning
blocking and without hiding untriaged diagnostics. Every historical diagnostic
must either be fixed or represented by a narrow file/rule override that is
backed by the classifier and exception docs.

- [x] **Step 1: Prove and fix sanitizer warning instead of suppressing it**

Added tests for:

- mixed-case `script` and `iframe` tags
- unsafe tags with attributes
- missing closing tags
- nested script payloads

The nested script test failed against the old implementation because payload
text could leak after the first closing tag. The implementation was then
changed to an explicit scanner that tracks nested unsafe tags and no longer
uses the `indexOf()` pattern React Doctor reported.

- [x] **Step 2: Confirm sanitizer warnings disappear**

Fresh classification after the sanitizer fix:

```text
total: 426
errors: 0
warnings: 426
unresolved: 0
needs-manual-proof: 0
```

- [x] **Step 3: Add native React Doctor config**

Created `react-doctor.config.json` using only `ignore.overrides`.

Rules:

- no global `ignore.rules`
- no whole-directory `ignore.files`
- each override is a narrow file/rule combination
- historical warnings remain documented in the classifier output, policy, and
  exception registry

- [x] **Step 4: Add raw governance guard**

Added `pnpm react:doctor:raw-governance` and wired it into CI.

This guard runs React Doctor through a temporary root config without project
overrides, classifies the pre-suppression diagnostics, and verifies:

- all raw diagnostics still have disposition, owner, and reason
- `unresolved` remains 0
- `react-doctor.config.json` has no global `ignore.rules`
- `react-doctor.config.json` has no whole-file `ignore.files`
- each configured file/rule suppression exactly matches the current raw
  diagnostic file/rule set

- [x] **Step 5: Verify native React Doctor zero**

`pnpm react:doctor` now loads `react-doctor.config.json` and reports:

```text
No issues found!
100 / 100 Great
```

Fresh JSON summary:

```text
errorCount: 0
warningCount: 0
affectedFileCount: 0
totalDiagnosticCount: 0
score: 100
scoreLabel: Great
```

---

## Final verification for the whole governance program

> **Historical/superseded note:** This final verification block belongs to the
> old 2026-05-10 governance program. After W1-2, do not run the removed
> governance/raw-governance commands as current verification.

Run these commands before claiming the governance plan is implemented:

```bash
pnpm react:doctor
pnpm react:doctor:governance
pnpm react:doctor:raw-governance
pnpm lint:check
pnpm type-check
pnpm test
```

Expected:

- `pnpm react:doctor` exits 0.
- `pnpm react:doctor:governance` exits 0 with native post-config 0 diagnostics.
- `pnpm react:doctor:raw-governance` exits 0 with pre-config raw diagnostics fully classified, 0 unresolved, and exact config coverage.
- `pnpm lint:check` exits 0.
- `pnpm type-check` exits 0.
- `pnpm test` exits 0.
- classified reports exist in the system temp directory and `reports/quality/react-doctor-classified.json`.
- `blocking-error` is 0.
- warning gate is not upgraded to raw `--fail-on warning`.

## Stop lines

Stop and ask before doing any of these:

- deleting files because a tool says they are unused
- changing `react:doctor` to `--fail-on warning`
- removing Radix/shadcn `forwardRef` wrappers in bulk
- changing JSON-LD escaping or structured data injection
- replacing local SVG logo delivery with `next/image`
- changing Cloudflare, middleware/proxy, or runtime deployment behavior while cleaning React Doctor warnings

## Self-review

- Spec coverage: This plan covers classification, docs, known exceptions, production risk waves, test fixture noise, and gate upgrade criteria.
- Placeholder scan: No TBD/TODO placeholders remain.
- Type consistency: Bucket names are consistent across docs, classifier, tests, and gate criteria.
