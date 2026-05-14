# MDX Manifest Truth Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the generated content manifest and MDX importer map the only runtime source for MDX content, with frontmatter validation enforced before generated artifacts are written.

**Architecture:** Keep `content/**` as the authoring source, keep `src/lib/content-manifest.generated.ts` and `src/lib/mdx-importers.generated.ts` as generated runtime artifacts, and add tests that prevent filesystem fallback from returning to runtime code. Reuse the existing content frontmatter validator in the manifest generator so invalid content fails before generated files are written.

**Tech Stack:** Node.js scripts, gray-matter, js-yaml, Next.js 16 App Router, React Server Components, TypeScript strict mode, Vitest, pnpm.

---

## Scope and hard boundaries

- Do not hand-edit `src/lib/content-manifest.generated.ts`.
- Do not hand-edit `src/lib/mdx-importers.generated.ts`.
- Do not migrate SEO/content/email family files in this plan.
- Do not change route component behavior or page visuals.
- Do not run `pnpm build` and `pnpm website:build:cf` in parallel.
- Generated artifacts may only change by running `node scripts/starter-checks.js content-manifest`.
- If existing content fails the new generator validation, fix the source content or narrow the gate to the already documented strict-frontmatter contract; do not bypass validation silently.

## File structure map

### Runtime files

- Modify: `src/lib/mdx-loader.ts`
  - Keep generated importer map as the only component source.
  - Preserve `null` behavior for missing manifest/importer/import failures.
- Modify: `src/lib/content-manifest.ts`
  - Keep generated manifest as the only entry source.
  - No runtime filesystem imports.

### Generator files

- Modify: `scripts/starter-checks.js`
  - Validate scanned content entries before writing generated artifacts.
  - Export generator helpers only if tests need direct access.
- Modify: `scripts/quality/checks/content-slugs.js`
  - Reuse existing validation helpers if needed; avoid duplicating field rules.

### Tests

- Create: `tests/architecture/mdx-manifest-runtime-contract.test.ts`
  - Verifies runtime files do not import filesystem/parser/glob modules.
  - Verifies `mdx-loader` imports generated importers.
- Create or modify: `src/lib/__tests__/mdx-loader.test.ts`
  - Verifies missing manifest entry returns `null`.
  - Verifies missing importer returns `null`.
  - Verifies importer rejection returns `null`.
- Modify: `tests/unit/scripts/mdx-slug-sync.test.ts`
  - Adds generator/frontmatter validation coverage if direct helper exports are used.
- Modify: `tests/unit/scripts/content-readiness-check.test.ts` only if manifest validation shares readiness behavior.

### Docs

- Modify: `docs/website/内容设置.md`
  - Explain content authoring vs generated runtime manifest.
- Modify: `docs/website/AI工作流.md`
  - Explain that generated content artifacts are refreshed with `node scripts/starter-checks.js content-manifest`.

## Task 1: Add runtime manifest-only contract tests

**Files:**
- Create: `tests/architecture/mdx-manifest-runtime-contract.test.ts`

- [ ] **Step 1: Write failing architecture test**

Create `tests/architecture/mdx-manifest-runtime-contract.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const RUNTIME_FILES = [
  "src/lib/content-manifest.ts",
  "src/lib/mdx-loader.ts",
] as const;

const FORBIDDEN_RUNTIME_IMPORTS = [
  "node:fs",
  "fs",
  "node:path",
  "path",
  "gray-matter",
  "glob",
  "fast-glob",
] as const;

function readSource(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local runtime files from the allowlist above
  return readFileSync(relativePath, "utf8");
}

describe("MDX manifest-only runtime contract", () => {
  it("keeps runtime content loading free of filesystem and parser imports", () => {
    for (const file of RUNTIME_FILES) {
      const source = readSource(file);

      for (const forbidden of FORBIDDEN_RUNTIME_IMPORTS) {
        expect(source).not.toContain(`from "${forbidden}"`);
        expect(source).not.toContain(`from '${forbidden}'`);
        expect(source).not.toContain(`require("${forbidden}")`);
        expect(source).not.toContain(`require('${forbidden}')`);
      }
    }
  });

  it("loads runtime manifest and MDX components from generated artifacts", () => {
    expect(readSource("src/lib/content-manifest.ts")).toContain(
      "./content-manifest.generated",
    );
    expect(readSource("src/lib/mdx-loader.ts")).toContain(
      "@/lib/mdx-importers.generated",
    );
  });
});
```

- [ ] **Step 2: Run architecture test to verify current contract**

Run:

```bash
pnpm exec vitest run tests/architecture/mdx-manifest-runtime-contract.test.ts
```

Expected: PASS if runtime is already manifest-only. If this fails, fix runtime imports before proceeding.

## Task 2: Add runtime behavior tests for missing manifest/importer cases

**Files:**
- Create: `src/lib/__tests__/mdx-loader.test.ts`
- Modify: `src/lib/mdx-loader.ts`

- [ ] **Step 1: Write behavior tests with module mocks**

Create `src/lib/__tests__/mdx-loader.test.ts`:

```ts
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getContentEntryMock = vi.hoisted(() => vi.fn());
const pageImporterMock = vi.hoisted(() => vi.fn());
const failingImporterMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/content-manifest", () => ({
  getContentEntry: getContentEntryMock,
}));

vi.mock("@/lib/mdx-importers.generated", () => ({
  pageImporters: {
    en: {
      exists: pageImporterMock,
      fails: failingImporterMock,
    },
  },
  postImporters: {
    en: {},
  },
  productImporters: {
    en: {},
  },
}));

describe("mdx-loader manifest-only runtime behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    getContentEntryMock.mockReset();
    pageImporterMock.mockReset();
    failingImporterMock.mockReset();
  });

  it("returns null when the manifest entry is missing", async () => {
    getContentEntryMock.mockReturnValue(undefined);
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(getMDXComponent("pages", "en", "missing")).resolves.toBeNull();
    expect(pageImporterMock).not.toHaveBeenCalled();
  });

  it("returns null when the manifest entry exists but no importer exists", async () => {
    getContentEntryMock.mockReturnValue({
      type: "pages",
      locale: "en",
      slug: "missing-importer",
      extension: ".mdx",
      filePath: "/content/pages/en/missing-importer.mdx",
      relativePath: "content/pages/en/missing-importer.mdx",
      metadata: {},
      content: "",
    });
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(
      getMDXComponent("pages", "en", "missing-importer"),
    ).resolves.toBeNull();
  });

  it("returns the generated importer component when manifest and importer exist", async () => {
    const Component: ComponentType = () => null;
    getContentEntryMock.mockReturnValue({
      type: "pages",
      locale: "en",
      slug: "exists",
      extension: ".mdx",
      filePath: "/content/pages/en/exists.mdx",
      relativePath: "content/pages/en/exists.mdx",
      metadata: {},
      content: "",
    });
    pageImporterMock.mockResolvedValue({ default: Component });
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(getMDXComponent("pages", "en", "exists")).resolves.toBe(
      Component,
    );
  });

  it("returns null when the generated importer rejects", async () => {
    getContentEntryMock.mockReturnValue({
      type: "pages",
      locale: "en",
      slug: "fails",
      extension: ".mdx",
      filePath: "/content/pages/en/fails.mdx",
      relativePath: "content/pages/en/fails.mdx",
      metadata: {},
      content: "",
    });
    failingImporterMock.mockRejectedValue(new Error("load failed"));
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(getMDXComponent("pages", "en", "fails")).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run behavior test**

Run:

```bash
pnpm exec vitest run src/lib/__tests__/mdx-loader.test.ts
```

Expected: PASS if current behavior already matches manifest-only runtime. If it fails, update `src/lib/mdx-loader.ts` without adding filesystem fallback.

## Task 3: Enforce frontmatter validation inside content manifest generation

**Files:**
- Modify: `scripts/starter-checks.js`
- Modify: `tests/unit/scripts/mdx-slug-sync.test.ts`

- [ ] **Step 1: Add exported helper coverage for generator validation**

In `tests/unit/scripts/mdx-slug-sync.test.ts`, add tests that call the `starter-checks.js` facade. The tests should use temporary fixture content and prove:

```ts
it("content manifest generation rejects invalid frontmatter before writing generated files", () => {
  // Create fixture root with content/pages/en/about.mdx missing seo.description.
  // Call a helper exported from starter-checks.js, for example generateContentManifestForRoot(fixtureRoot).
  // Expect it to throw a message containing "seo.description is required".
});

it("content manifest generation accepts valid paired page frontmatter", () => {
  // Create fixture root with valid en/zh content/pages/about.mdx.
  // Call the exported helper.
  // Expect manifest.byKey["pages/en/about"] and ["pages/zh/about"] to exist.
});
```

Use exact helper names after adding them in Step 2.

- [ ] **Step 2: Extract manifest generation helpers**

In `scripts/starter-checks.js`, make the content-manifest functions accept explicit roots/outputs instead of relying only on global constants. Add a small internal helper:

```js
function createContentManifestContext(rootDir = ROOT) {
  return {
    rootDir,
    contentDir: path.join(rootDir, "content"),
    reportOutput: path.join(rootDir, "reports", "content-manifest.json"),
    importersOutput: path.join(rootDir, "src", "lib", "mdx-importers.generated.ts"),
    manifestTsOutput: path.join(rootDir, "src", "lib", "content-manifest.generated.ts"),
  };
}
```

Then update scanning/generation to take `context`.

- [ ] **Step 3: Reuse frontmatter validation before writing outputs**

Use `validateContentFrontmatterContract` from `scripts/quality/checks/content-slugs.js` before writing generated files:

```js
function assertContentManifestFrontmatterValid(rootDir) {
  const result = validateContentFrontmatterContract({
    rootDir,
    collections: CONTENT_TYPES,
    locales: CONTENT_MANIFEST_LOCALES,
    strictFrontmatter: false,
  });

  if (result.ok) return;

  const detail = result.issues
    .slice(0, 10)
    .map((issue) => `- ${issue.filePath}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `Content manifest frontmatter validation failed:\n${detail}`,
  );
}
```

Call this before `generateContentManifest(context)` writes anything.

- [ ] **Step 4: Export test helpers without changing CLI behavior**

At the bottom of `scripts/starter-checks.js`, export helpers already used by tests plus new helpers:

```js
module.exports = {
  ...existingExports,
  createContentManifestContext,
  generateContentManifest,
  runContentManifestGenerator,
  assertContentManifestFrontmatterValid,
};
```

Keep CLI behavior unchanged for normal `node scripts/starter-checks.js content-manifest`.

- [ ] **Step 5: Run generator tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/mdx-slug-sync.test.ts
```

Expected: new tests fail before implementation, then PASS after helper extraction and validation.

## Task 4: Regenerate manifest artifacts through the generator

**Files:**
- Generated by command only:
  - `reports/content-manifest.json`
  - `src/lib/content-manifest.generated.ts`
  - `src/lib/mdx-importers.generated.ts`

- [ ] **Step 1: Run generator**

Run:

```bash
node scripts/starter-checks.js content-manifest
```

Expected: command exits 0 and prints generated entry counts.

- [ ] **Step 2: Inspect generated diff**

Run:

```bash
git diff -- src/lib/content-manifest.generated.ts src/lib/mdx-importers.generated.ts reports/content-manifest.json
```

Expected: either no diff or purely generator-format diff caused by code changes. If content changed unexpectedly, stop and inspect before proceeding.

## Task 5: Document manifest-only content workflow

**Files:**
- Modify: `docs/website/内容设置.md`
- Modify: `docs/website/AI工作流.md`

- [ ] **Step 1: Update content docs**

In `docs/website/内容设置.md`, add:

```markdown
## MDX manifest refresh

MDX files under `content/**` are the authoring source. Runtime rendering uses
generated files:

- `src/lib/content-manifest.generated.ts`
- `src/lib/mdx-importers.generated.ts`

After adding, removing, renaming, or editing MDX files, run:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-slugs
```

Do not hand-edit generated manifest files.
```

- [ ] **Step 2: Update AI workflow docs**

In `docs/website/AI工作流.md`, add a short note under Skills or 不入库:

```markdown
## Generated content artifacts

AI agents must not hand-edit `src/lib/content-manifest.generated.ts` or
`src/lib/mdx-importers.generated.ts`. Refresh them through:

```bash
node scripts/starter-checks.js content-manifest
```
```

- [ ] **Step 3: Run docs/runtime contract tests**

Run:

```bash
pnpm exec vitest run tests/architecture/mdx-manifest-runtime-contract.test.ts src/lib/__tests__/mdx-loader.test.ts
```

Expected: PASS.

## Task 6: Full validation and commit

**Files:**
- All files changed above.

- [ ] **Step 1: Run focused commands**

Run:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-slugs
pnpm exec vitest run tests/unit/scripts/mdx-slug-sync.test.ts tests/unit/scripts/content-readiness-check.test.ts tests/architecture/mdx-manifest-runtime-contract.test.ts src/lib/__tests__/mdx-loader.test.ts
```

Expected: all commands exit 0.

- [ ] **Step 2: Run type and lint**

Run:

```bash
pnpm type-check
pnpm lint:check
```

Expected: both commands exit 0.

- [ ] **Step 3: Run broad tests**

Run:

```bash
pnpm test
```

Expected: exit 0.

- [ ] **Step 4: Run builds sequentially**

Run:

```bash
pnpm build
pnpm website:build:cf
```

Expected: both commands exit 0. Existing non-blocking warnings must be reported exactly.

- [ ] **Step 5: Run diff hygiene**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only intended files changed.

- [ ] **Step 6: Commit**

Run:

```bash
git add scripts/starter-checks.js scripts/quality/checks/content-slugs.js tests/unit/scripts/mdx-slug-sync.test.ts tests/architecture/mdx-manifest-runtime-contract.test.ts src/lib/__tests__/mdx-loader.test.ts docs/website/内容设置.md docs/website/AI工作流.md reports/content-manifest.json src/lib/content-manifest.generated.ts src/lib/mdx-importers.generated.ts
git commit -m "refactor: enforce mdx manifest runtime contract"
```

Expected: commit succeeds and contains only MDX manifest runtime/generator contract changes.

## Final verification checklist

- `src/lib/content-manifest.ts` has no filesystem/parser runtime imports.
- `src/lib/mdx-loader.ts` has no filesystem/parser runtime imports.
- `src/lib/mdx-loader.ts` returns `null` for missing manifest, missing importer, and importer failure.
- `node scripts/starter-checks.js content-manifest` validates frontmatter before writing generated artifacts.
- Generated artifact files were refreshed only by the generator command.
- Docs tell future agents and project users how to refresh generated content artifacts.
