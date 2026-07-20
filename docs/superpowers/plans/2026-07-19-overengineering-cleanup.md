> Historical.

# Over-Engineering Cleanup Implementation Plan (3 PR Batches)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove verified over-engineering found by the 2026-07-19 ponytail audit: negative-space guards, test-only production code, duplicate/replaceable dependencies, a vacuous dep-cruiser rule, dead token surfaces, dual prop protocols, and the phrase-pinning half of the truth-docs gate — while preserving every live invariant (lead delivery graph proof, doc inventory gate, LCP motion boundary).

**Architecture:** Three sequential PRs. Batch 1 is pure deletion and dependency swaps (near-zero risk). Batch 2 consolidates code that has tests attached. Batch 3 reworks the truth-docs CI gate itself and is isolated so gate regressions cannot mix with code changes. Every finding in this plan was re-verified against the working tree on 2026-07-19 (callers grepped, CI wiring confirmed, Node 24 pinned in `engines`, `.nvmrc`, and all workflows). During execution on 2026-07-20, Task 2's React Doctor override references were found by the full test gate and added to the task scope before implementation continued.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Vitest, Playwright, dependency-cruiser 17 (wired into CI at `.github/workflows/ci.yml:79` and lefthook, `-T err` = only `severity: "error"` rules block), pnpm, Node >=24 <25.

## Global Constraints

- Node `>=24 <25` (package.json `engines`); `fs.globSync` and `process.loadEnvFile` are available.
- Never delete files with `rm`/`rmdir`/`git rm`/`find -delete`/`git clean`. Remove a tracked file by moving it to Trash, then staging the deletion explicitly:
  ```bash
  mkdir -p "$HOME/.Trash" && mv <path> "$HOME/.Trash/<basename>.$(date +%s)" && git add -u -- <path>
  ```
  Directories move the same way (one `mv`, then `git add -u -- <dir>`). Never delete untracked files you did not create yourself.
- Stage explicitly: `git add -- <file...>` for edits, `git add -u -- <path...>` for removals. Never `git add -A` or `git add .` — unrelated working-tree files must not ride along.
- Never run `git checkout -- <file>` or `git restore` on pre-existing files to undo probe edits. Verification probes must be NEW files you create, verify with, then move to Trash.
- TypeScript strict, no `any`. ESLint zero warnings (`--max-warnings 0`).
- Commit messages: commitlint enforces lowercase subject, conventional prefix (`chore:`, `test:`, `refactor:`, `docs:`).
- lefthook runs checks on commit/push, including `pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err`.
- `pnpm build` and `pnpm website:build:cf` must never run in parallel.
- GitHub Flow: one feature branch and one isolated worktree per batch, with one PR to `main`. Cursor stops after push, exact-SHA CI and its task/PR self-review. Codex then performs the independent acceptance review. This plan has standing owner authorization for Codex to merge an `ACCEPTED` batch PR and start the next batch; any failed check, material finding, conflict or semantic drift pauses that authorization.
- Do not touch `docs/design/组件使用手册.md` (Registry), the Playbook, or component governance entry points.
- After any `package.json` dependency edit, run `pnpm install` so `pnpm-lock.yaml` stays in sync (lockfile drift fails CI).

## Controller and execution workflow

- Codex is the controller. It owns task order, exact prompts, scope decisions, verification, acceptance and merge decisions.
- Cursor Agent is the implementer. Use the exact current model ID `composer-2.5`; never silently fall back to `auto`, `composer-2.5-fast` or another model.
- Use one dedicated worktree per batch: `.worktrees/overengineering-cleanup-1`, `.worktrees/overengineering-cleanup-2`, and `.worktrees/overengineering-cleanup-3`.
- Use one fresh Cursor chat per task in the batch worktree. Resume only the same interrupted task by exact chat ID; never use `--continue` to carry one task into another.
- Every Cursor prompt must include the current task's full text, exact base SHA, allowed files, required rules/docs, verification commands, forbidden actions and stop conditions. Cursor does not choose extra scope or merge order.
- Cursor must use the installed Superpowers workflow: `superpowers:executing-plans` for task execution, `superpowers:test-driven-development` for behavior changes or bug fixes, and `superpowers:verification-before-completion` before any completion claim.
- Cursor returns exactly one terminal status: `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT` or `BLOCKED`. Its report is not completion evidence; Codex independently checks the diff, commits and fresh command output before starting the next task.
- Tasks inside one batch remain sequential commits on the same branch. After the batch gate, Cursor pushes and opens the PR but never merges it.
- A batch reaches `READY_FOR_ACCEPTANCE` only when the latest PR head SHA has all required CI checks green and the evidence packet is complete. Codex then returns `ACCEPTED`, `CHANGES_REQUIRED` or `BLOCKED`.
- After `ACCEPTED`, Codex merges the PR, verifies the resulting `origin/main` SHA and the batch's decisive checks, removes the completed worktree, then creates the next batch worktree from updated `main`.

## Deliberate Deviations from the Codex Audit

These are decisions, not oversights — do not "fix" them during execution:

1. **`useLeadFormSubmission` is NOT collapsed into an inquiry-specific hook** (audit item 3, first half). The collapse would force the hook to import `createInquiryPayload`/`decodeInquirySubmitState` from `src/components/forms/`, which the dep-cruiser rule `no-lib-to-components-or-app` forbids — so it becomes a cross-layer file move plus a 294-line behavior-test port through the Turnstile trust boundary, for a net saving of ~40 lines. Only the AST identity gates and their fixtures are deleted (Task 10).
2. **The lead-delivery import-graph tests are KEPT** (`tests/architecture/lead-write-endpoint.test.ts` lines 340–379). "Only `/api/inquiry` reaches lead delivery sinks" is a live security invariant, not a shape test.
3. **The backticked-path negation parser is replaced with an explicit `truth-docs:allow-missing` marker, not a natural-language heuristic** (audit item 1). A bare existence check would false-positive on lines like ``不要创建 `src/x` `` where the path is *supposed* to be missing — but a "line contains a negation word → skip whole line" heuristic creates real misses (e.g. `.claude/rules/cloudflare.md` line 70 mentions the live `src/middleware.ts` and the intentionally-absent `src/proxy.ts` in one "Do not" sentence). Default: every backticked repo path must exist; only lines carrying the explicit marker are exempt.

---

# Batch 1 — pure deletions and dependency swaps

Branch: `chore/overengineering-cleanup-1`

### Task 1: Commit this plan and register it in the doc inventory

The truth-docs CI gate requires every tracked doc under `docs/superpowers/**` to carry the `> Historical.` banner (this file has it on line 1) and a row in the doc inventory. Without the row, the first push fails CI.

**Files:**
- Create (already written): `docs/superpowers/plans/2026-07-19-overengineering-cleanup.md`
- Modify: `docs/项目基础/文档清单.md`

- [ ] **Step 1: Create the branch**

```bash
git switch main
git pull --ff-only
git switch -c chore/overengineering-cleanup-1
```

- [ ] **Step 2: Add the inventory row**

In `docs/项目基础/文档清单.md`, find the table block of `docs/superpowers/plans/...` rows (they look like `| docs/superpowers/plans/2026-07-03-docs-structure-realignment.md | historical-proof | 历史 docs 结构调整计划。 |`). Append after the last such row:

```markdown
| docs/superpowers/plans/2026-07-19-overengineering-cleanup.md | `historical-proof` | 过度工程清理三批执行计划（2026-07 ponytail 审计裁剪版）。 |
```

Match the exact cell style of the neighbouring rows (some tables backtick-quote the class cell — copy whatever the adjacent rows do).

- [ ] **Step 3: Verify the gate passes**

```bash
node scripts/starter-checks.js truth-docs
```
Expected: `current-truth-docs: passed`

- [ ] **Step 4: Commit**

```bash
git add -- docs/superpowers/plans/2026-07-19-overengineering-cleanup.md docs/项目基础/文档清单.md
git commit -m "docs: add overengineering cleanup plan"
```

### Task 2: Delete the negative-space lib facade guard

`tests/architecture/lib-facade-boundary.test.ts` (188 lines) is dropped for two reasons, stated precisely: the first four test blocks assert that already-deleted files stay deleted and old import names stay absent (the guard class `CLAUDE.md` Gate Discipline forbids); the last three blocks (lines 153–187) are *source-shape* string assertions on the csp-report and inquiry routes (`toContain`/`not.toContain` on source text) whose live behavior is already covered by the routes' own behavior tests. No code imports it. `doctor.config.json` lists the file in two React Doctor override arrays, so those stale configuration entries must be removed in the same task; `tests/architecture/config-exact-paths-exist.test.ts` enforces that configured paths remain live.

**Files:**
- Delete: `tests/architecture/lib-facade-boundary.test.ts`
- Modify: `doctor.config.json` (remove both exact override entries for the deleted test)

- [ ] **Step 1: Prove the surviving behavior coverage passes BEFORE deleting**

```bash
pnpm exec vitest run \
  src/app/api/csp-report/__tests__/route-post-security.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/inquiry/__tests__/inquiry-integration.test.ts
```
Expected: PASS. If any of these fail, STOP — the shape assertions are not yet redundant.

- [ ] **Step 2: Remove (Trash + staged deletion) and verify**

```bash
mkdir -p "$HOME/.Trash"
mv tests/architecture/lib-facade-boundary.test.ts "$HOME/.Trash/lib-facade-boundary.test.ts.$(date +%s)"
git add -u -- tests/architecture/lib-facade-boundary.test.ts
```

Remove both `"tests/architecture/lib-facade-boundary.test.ts"` entries from `doctor.config.json`, preserving the surrounding override rules and every other path. Then stage only that config edit:

```bash
git add -- doctor.config.json
pnpm test
```
Expected: all tests pass; the removed file no longer runs, and the exact-path guard confirms React Doctor has no stale reference to it.

- [ ] **Step 3: Commit**

```bash
git commit -m "test: drop negative-space lib facade boundary guard"
```

### Task 3: Delete test-only production modules

Verified on 2026-07-19: `useCurrentTime` and `form-status-styles` have **zero** production importers — each is referenced only by its own test. `form-status-styles.ts` is also the sole dep-cruiser orphan warning.

**Files:**
- Delete: `src/hooks/use-current-time.ts`
- Delete: `src/hooks/__tests__/use-current-time.test.tsx`
- Delete: `src/components/forms/form-status-styles.ts`
- Delete: `src/components/forms/__tests__/form-status-styles.test.ts`

- [ ] **Step 1: Re-confirm zero callers (cheap safety, greps must return only the files being deleted)**

```bash
grep -rln "use-current-time\|useCurrentTime\|form-status-styles" src tests scripts
```
Expected output: exactly the four paths listed above. If anything else appears, STOP and report.

- [ ] **Step 2: Remove (Trash + staged deletion) and verify**

```bash
mkdir -p "$HOME/.Trash"
stamp=$(date +%s)
mv src/hooks/use-current-time.ts "$HOME/.Trash/use-current-time.ts.$stamp"
mv src/hooks/__tests__/use-current-time.test.tsx "$HOME/.Trash/use-current-time.test.tsx.$stamp"
mv src/components/forms/form-status-styles.ts "$HOME/.Trash/form-status-styles.ts.$stamp"
mv src/components/forms/__tests__/form-status-styles.test.ts "$HOME/.Trash/form-status-styles.test.ts.$stamp"
git add -u -- src/hooks/use-current-time.ts src/hooks/__tests__/use-current-time.test.tsx \
  src/components/forms/form-status-styles.ts src/components/forms/__tests__/form-status-styles.test.ts
pnpm test && pnpm type-check
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove test-only use-current-time and form-status-styles"
```

### Task 4: Drop the vacuous `no-orphans` dep-cruiser rule

The rule is `severity: "warn"` while CI/lefthook run `-T err`, so it can never block anything; its allowlist already excludes `src/lib`, `src/config`, `src/constants`, UI, and hooks. Knip (`files: "error"`) owns orphan-file detection.

**Files:**
- Modify: `.dependency-cruiser.js` (the `no-orphans` rule object, currently lines 59–117)

- [ ] **Step 1: Delete the entire rule object**

Remove the whole `{ name: "no-orphans", ... }` entry from the `forbidden` array — from the line `name: "no-orphans",`'s enclosing `{` through its matching `},`.

- [ ] **Step 2: Verify the config still parses and passes**

```bash
pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err
pnpm knip:check
```
Expected: dependency-cruiser exits 0; knip passes.

- [ ] **Step 3: Commit**

```bash
git add -- .dependency-cruiser.js
git commit -m "chore: drop vacuous no-orphans dependency-cruiser rule"
```

### Task 5: Replace `glob` and `dotenv` with Node built-ins

`glob` is used only in `scripts/quality/checks/content-slugs.js`; `dotenv` only in `playwright.config.ts`. Node 24 provides `fs.globSync` and `process.loadEnvFile` (same no-override semantics as dotenv: existing env vars win). `process.loadEnvFile` **throws** when the file is missing, so it needs an `existsSync` guard — `.env.test` may legitimately be absent in CI.

**Files:**
- Modify: `scripts/quality/checks/content-slugs.js:4,107,120,448`
- Modify: `playwright.config.ts:1-5`
- Modify: `package.json` (remove `glob`, `dotenv` from devDependencies)

- [ ] **Step 1: Swap glob for fs.globSync in content-slugs.js**

Delete line 4:
```js
const { glob } = require("glob");
```
(`fs` is already required on line 1.) Then replace all three call sites:
- line 107: `glob.sync(basePattern).sort()` → `fs.globSync(basePattern).sort()`
- line 120: `glob.sync(targetPattern).sort()` → `fs.globSync(targetPattern).sort()`
- line 448: `glob.sync(pattern)` → `fs.globSync(pattern)`

(Result order differences don't matter: every call site sorts or Set-dedups afterwards.)

- [ ] **Step 2: Verify the content check still passes**

```bash
pnpm content:check
```
Expected: PASS (this runs content-slugs against the real `content/` tree).

- [ ] **Step 3: Swap dotenv for process.loadEnvFile in playwright.config.ts**

Replace the top of the file:

```ts
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// 加载测试环境配置
config({ path: ".env.test", quiet: true });
```

with:

```ts
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// 加载测试环境配置（loadEnvFile 对缺失文件会抛错，所以先判存在）
if (existsSync(".env.test")) {
  process.loadEnvFile(".env.test");
}
```

- [ ] **Step 4: Remove both dependencies and reinstall**

In `package.json` devDependencies, delete the `"dotenv": ...` and `"glob": ...` lines, then:

```bash
pnpm install
pnpm exec playwright test --list 2>&1 | head -5
```
Expected: `pnpm install` succeeds; Playwright lists tests without a config-load error.

- [ ] **Step 5: Commit**

```bash
git add -- scripts/quality/checks/content-slugs.js playwright.config.ts package.json pnpm-lock.yaml
git commit -m "chore: replace glob and dotenv with node built-ins"
```

### Task 6: Drop the duplicate `playwright` dependency

`package.json` carries both `playwright` and `@playwright/test` at `^1.60.0`. Nothing imports `"playwright"` directly (verified repo-wide grep); `@playwright/test` ships the same CLI and depends on the same `playwright-core`; `@axe-core/playwright` peer-depends only on `playwright-core`. Note: knip could not have caught this — its config sets `"devDependencies": "off"`.

**Files:**
- Modify: `package.json` (remove `"playwright": "^1.60.0"` from devDependencies)

- [ ] **Step 1: Remove and verify**

Delete the `"playwright": "^1.60.0",` line from devDependencies, then:

```bash
pnpm install
pnpm exec playwright --version
pnpm exec playwright test --list 2>&1 | head -5
```
Expected: version prints; listing works.

- [ ] **Step 2: Commit**

```bash
git add -- package.json pnpm-lock.yaml
git commit -m "chore: drop duplicate playwright dependency"
```

### Task 7: Batch 1 gate, push, PR

- [ ] **Step 1: Full local gate**

```bash
pnpm website:check
```
Expected: type-check, lint, test, build all green.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin chore/overengineering-cleanup-1
gh pr create --title "chore: overengineering cleanup batch 1 (pure deletions + dep swaps)" \
  --body "Batch 1 of docs/superpowers/plans/2026-07-19-overengineering-cleanup.md: delete negative-space facade guard, test-only modules, vacuous no-orphans rule; replace glob/dotenv with Node 24 built-ins; drop duplicate playwright dep. No behavior change."
```

- [ ] **Step 3: Wait for exact-SHA CI, Cursor self-review, and Codex acceptance**

Cursor stops at `READY_FOR_ACCEPTANCE` and never merges. Codex reviews the complete Batch 1 diff and evidence. If `ACCEPTED`, Codex merges the PR under the standing authorization above, verifies updated `origin/main`, removes the Batch 1 worktree, and starts Batch 2 from that exact main SHA.

---

# Batch 2 — consolidation with test updates

Branch: `chore/overengineering-cleanup-2` (from updated `main` after Batch 1 merges)

### Task 8: Unify `SocialIconLink` to a single prop protocol

The component maintains V1 (`icon`/`label`/`ariaLabel`) and V2 (`platform`/`aria-label`/`children`) protocols with runtime type sniffing and a `null` fallback — and has **zero production callers** (Storybook/tests only; verified 2026-07-19). Full retirement would need a Registry retirement proof, so this task only collapses to the V2 protocol (the one most stories/tests use). Icon components (`TwitterIcon` etc.) and `SocialIconMapper` are untouched.

**Files:**
- Modify: `src/components/ui/social-icons.tsx:175-256`
- Modify: `src/components/ui/social-icons.stories.tsx` (every V1-prop usage)
- Modify: `src/components/ui/__tests__/social-icons-accessibility.test.tsx` (first test case)
- Test: `src/components/ui/__tests__/social-icons-integration.test.tsx` (unchanged — already V2-only)

**Interfaces:**
- Produces: `SocialIconLink: FC<SocialIconLinkProps>` where `SocialIconLinkProps = { href: string; platform: string; "aria-label": string; className?: string; iconSize?: number; "data-testid"?: string; children?: ReactNode }`

- [ ] **Step 1: Replace everything from the comment `// Social Icon with Link Component - Support both interface styles` (line 175) to the end of the file with:**

```tsx
// Social Icon with Link Component
interface SocialIconLinkProps {
  href: string;
  platform: string;
  "aria-label": string;
  className?: string;
  iconSize?: number;
  "data-testid"?: string;
  children?: ReactNode;
}

export const SocialIconLink: FC<SocialIconLinkProps> = ({
  href,
  platform,
  "aria-label": ariaLabel,
  className = "",
  iconSize = DEFAULT_ICON_SIZE,
  "data-testid": dataTestId,
  children,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className={`inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
    {...(dataTestId && { "data-testid": dataTestId })}
  >
    {children || <SocialIconMapper platform={platform} size={iconSize} />}
  </a>
);
```

- [ ] **Step 2: Convert every V1 usage in the stories**

In `social-icons.stories.tsx`, find every `<SocialIconLink>` that passes `icon=`/`label=`/`ariaLabel=` and convert to the platform protocol. The known one in the `Links` story:

```tsx
<SocialIconLink
  href="https://example.com"
  icon="external"
  label="Website"
  ariaLabel="Company website"
/>
```
becomes:
```tsx
<SocialIconLink
  href="https://example.com"
  platform="website"
  aria-label="Company website"
/>
```
(`SocialIconMapper` falls back to `ExternalLinkIcon` for unknown platforms, so the rendered icon is identical.) Apply the same conversion to any other V1 usage in the file (check the `OnDarkBackground` story too), then verify:

```bash
grep -n "ariaLabel=\|icon=\"" src/components/ui/social-icons.stories.tsx
```
Expected: no matches.

- [ ] **Step 3: Rewrite the legacy-protocol accessibility test**

In `social-icons-accessibility.test.tsx`, replace the first test case (`renders legacy social links with accessible names and hidden labels`) with:

```tsx
it("renders social links with accessible names", () => {
  render(
    <SocialIconLink
      href="https://example.com/twitter"
      platform="twitter"
      aria-label="Follow us on Twitter"
    />,
  );

  const link = screen.getByRole("link", { name: "Follow us on Twitter" });
  expect(link).toHaveAttribute("href", "https://example.com/twitter");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
});
```
(The `sr-only` label assertion goes away with the V1 protocol.) The other two cases in the file already use the platform protocol — leave them.

- [ ] **Step 4: Verify**

```bash
pnpm exec vitest run src/components/ui/__tests__/social-icons-accessibility.test.tsx src/components/ui/__tests__/social-icons-integration.test.tsx
pnpm type-check && pnpm lint:check
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -- src/components/ui/social-icons.tsx src/components/ui/social-icons.stories.tsx src/components/ui/__tests__/social-icons-accessibility.test.tsx
git commit -m "refactor: unify social icon link to a single prop protocol"
```

### Task 9: Retire the footer style token surface

`FOOTER_STYLE_TOKENS` is read only by tests; the real `Footer.tsx` styles itself with Tailwind classes and CSS variables directly. Five surfaces reference the file and ALL must change together, or CI fails: (1) the token file, (2) `footer-links.ts` re-export + four token interfaces, (3) `globals.css` line 5 `@source "../config/footer-style-tokens.ts";` (Tailwind v4 scans it; pointing at a deleted file breaks the build), (4) three test files, (5) `.claude/rules/code-quality.md` backticks the path and the truth-docs gate checks that documented `src/` paths exist.

**Files:**
- Delete: `src/config/footer-style-tokens.ts`
- Modify: `src/config/footer-links.ts` (full replacement below)
- Modify: `src/app/globals.css:5`
- Modify: `src/app/[locale]/__tests__/layout.test.tsx:114-117`
- Modify: `src/config/__tests__/static-theme-colors.test.ts:15-18`
- Modify: `tests/architecture/design-token-contract.test.ts` (all `FOOTER_STYLE` references)
- Modify: `.claude/rules/code-quality.md` (one sentence)

- [ ] **Step 1: Delete the token file and prune footer-links.ts**

First confirm nothing outside the files this task already edits consumes the token types:

```bash
grep -rn "FooterTokens\|FooterStyleTokens\|FOOTER_STYLE_TOKENS" src tests --include="*.ts" --include="*.tsx" \
  | grep -v "footer-style-tokens.ts\|footer-links.ts\|design-token-contract.test.ts\|layout.test.tsx\|static-theme-colors.test.ts"
```
Expected: no output. If a hit appears, STOP and report before deleting. Also confirm the type re-exports have no consumers (verified 2026-07-19: `Footer.tsx` derives its own `FooterColumnConfig` from `typeof FOOTER_COLUMNS`):

```bash
grep -rn "FooterLinkItem\|FooterColumnConfig" src tests --include="*.ts" --include="*.tsx" | grep "@/config/footer-links"
```
Expected: no output. Then:

```bash
mkdir -p "$HOME/.Trash"
mv src/config/footer-style-tokens.ts "$HOME/.Trash/footer-style-tokens.ts.$(date +%s)"
git add -u -- src/config/footer-style-tokens.ts
```

Replace the entire content of `src/config/footer-links.ts` with:

```ts
// Footer truth is authored in `src/config/single-site.ts`; this module only
// exposes the active single-site columns.
import { SINGLE_SITE_FOOTER_COLUMNS } from "@/config/single-site";

export const FOOTER_COLUMNS = SINGLE_SITE_FOOTER_COLUMNS;
```

- [ ] **Step 2: Remove the Tailwind source directive**

In `src/app/globals.css`, delete line 5:
```css
@source "../config/footer-style-tokens.ts";
```

- [ ] **Step 3: Update the three tests**

`src/app/[locale]/__tests__/layout.test.tsx` — the footer-links mock loses the token key:
```tsx
vi.mock("@/config/footer-links", () => ({
  FOOTER_COLUMNS: [],
}));
```

`src/config/__tests__/static-theme-colors.test.ts` — the explicit scan list loses its purpose entirely (the pruned `footer-links.ts` carries no browser color/style values anymore): delete the `const EXPLICIT_BROWSER_UI_FILES = [...] as const;` declaration (line 15) AND the `...EXPLICIT_BROWSER_UI_FILES,` spread where it is consumed (line 104). Do not leave an empty scan surface. Verify: `grep -n "EXPLICIT_BROWSER_UI_FILES" src/config/__tests__/static-theme-colors.test.ts` returns nothing.

`tests/architecture/design-token-contract.test.ts` — run `grep -n "FOOTER_STYLE\|footer-style-tokens" tests/architecture/design-token-contract.test.ts`, then:
- delete the `import { FOOTER_STYLE_TOKENS } ...` line (line 3);
- delete `const FOOTER_STYLE_TOKEN_SOURCE = ...` (line 8) and any code using it;
- remove the expected entry `'@source "../config/footer-style-tokens.ts";'` (around line 98) from the expected-@source list so the assertion matches the pruned `globals.css`;
- delete the whole `it` block asserting `FOOTER_STYLE_TOKENS.typography.fontFamily` (around line 265).

Re-run the grep — expected: no matches.

- [ ] **Step 4: Update the rule doc so the truth-docs path check stays green**

In `.claude/rules/code-quality.md`, in the `no-magic-numbers detectObjects: false` measurement note, delete the example entirely — remove the fragment:

```
style tokens (`src/config/footer-style-tokens.ts`),
```

so the sentence flows directly from the light-breathing example to the layout-dimensions example. Do not replace it with a "since deleted" remark — the rule doc lists live examples, not cleanup history.

- [ ] **Step 5: Verify**

```bash
pnpm test && pnpm build
node scripts/starter-checks.js truth-docs
```
Expected: all green — `pnpm build` proves the `@source` removal is safe; truth-docs proves the doc edit sufficed.

- [ ] **Step 6: Commit (deletion already staged in Step 1)**

```bash
git add -- src/config/footer-links.ts src/app/globals.css \
  'src/app/[locale]/__tests__/layout.test.tsx' src/config/__tests__/static-theme-colors.test.ts \
  tests/architecture/design-token-contract.test.ts .claude/rules/code-quality.md
git commit -m "chore: retire footer style token surface"
```

### Task 10: Trim lead-write-endpoint to the graph proof

Delete the hook-identity half (TS type-checker program proving "the imported symbol really is `useLeadFormSubmission` from the real module" — 5 tests + 5 fixtures defending against hypothetical self-sabotage). Keep the import-graph half (5 tests): "only `/api/inquiry` reaches lead delivery sinks" is a live security invariant. The hook itself and its 294-line behavior test are untouched (see Deliberate Deviations #1).

**Files:**
- Modify: `tests/architecture/lead-write-endpoint.test.ts`
- Delete: `tests/architecture/fixtures/lead-write-endpoint/` (whole directory: `aliased.ts`, `shadowed.ts`, `fake-local.ts`, `wrong-module.ts`, `fake-lead-form-submission.ts`)
- Keep: `tests/architecture/fixtures/lead-write-graph-regression/` (used by the kept tests)

- [ ] **Step 1: Delete the identity half from the test file**

Remove these declarations (top of file): `INQUIRY_FORM`, `LEAD_FORM_SUBMISSION_MODULE`, `INQUIRY_ENDPOINT`, `ENDPOINT_FIXTURE_ROOT`, `ALIASED_FIXTURE`, `SHADOWED_FIXTURE`, `FAKE_LOCAL_FIXTURE`, `WRONG_MODULE_FIXTURE`, `FAKE_LEAD_FORM_SUBMISSION_FIXTURE`, `ENDPOINT_PROOF_FILES`.

Remove these functions: `absoluteRepoPath`, `loadRepoCompilerOptions`, `createEndpointProofProgram`, `getUseLeadFormSubmissionImportSymbol`, `callUsesInquiryEndpoint`, `configuresInquiryEndpointViaRealImport`.

Inside the `describe` block, remove the line `const endpointProofProgram = createEndpointProofProgram();` and these five `it` blocks:
- `configures InquiryForm to post through useLeadFormSubmission at /api/inquiry`
- `rejects a same-named local useLeadFormSubmission fake`
- `accepts an aliased import from the real useLeadFormSubmission module`
- `rejects useLeadFormSubmission imported from another module`
- `rejects a shadowed local binding that reuses the imported hook name`

Keep everything else: `INQUIRY_ROUTE`, the three `REGRESSION_*` constants, `LEAD_DELIVERY_SINKS`, `INQUIRY_REQUIRED_GRAPH_TARGETS`, `read`, `toRepoPath`, `createSourceFile`, `resolveImport`, `resolveExistingSourceFile`, `collectImportSpecifiers`, `collectDependencyGraph`, `graphReachesLeadDeliverySink`, `listApiRouteFiles`, and the five remaining `it` blocks (`keeps /api/inquiry as the only API route...`, `reaches schema, processor, owner email...`, `detects facade/barrel lead delivery...`, `detects lead delivery through string-literal dynamic import...`, `does not invent paths from non-literal dynamic imports`).

- [ ] **Step 2: Remove the now-orphaned fixtures (whole directory to Trash)**

```bash
mkdir -p "$HOME/.Trash"
mv tests/architecture/fixtures/lead-write-endpoint "$HOME/.Trash/lead-write-endpoint-fixtures.$(date +%s)"
git add -u -- tests/architecture/fixtures/lead-write-endpoint
```

- [ ] **Step 3: Verify (lint catches any unused leftover import such as `ts` — if `ts` is still used by `createSourceFile`/`collectImportSpecifiers`, keep it)**

```bash
pnpm exec vitest run tests/architecture/lead-write-endpoint.test.ts
pnpm lint:check
```
Expected: exactly the 5 kept tests pass; lint clean.

- [ ] **Step 4: Commit (fixture deletion already staged in Step 2)**

```bash
git add -- tests/architecture/lead-write-endpoint.test.ts
git commit -m "test: keep lead delivery graph proof, drop hook identity gates"
```

### Task 11: Shrink the homepage LCP motion boundary to behavior checks + split graph/import guards

The 579-line hand-rolled TS AST scanner is replaced by TWO complementary guards, because dependency-cruiser alone cannot cover the boundary: `.dependency-cruiser.js` `options.exclude` removes `node_modules` from the graph entirely, so edges to `motion/react`/`framer-motion` never appear in it (verified 2026-07-19 by generating the graph). The split:

1. **dependency-cruiser** (error level, already in CI + lefthook) guards *local wrapper* edges: non-home src files must not depend on `breathing-reveal`/`light-motion-provider` — including transitively, since every intermediate src file's direct edge is in the graph.
2. **A string-level specifier scan** inside the same Vitest file guards *direct npm imports* of `motion/react`/`framer-motion` outside the approved directories.
3. Two genuine *behavior* checks stay.

Verified consumer map (2026-07-19): only `src/app/[locale]/page.tsx` (home) imports `BreathingReveal`/`LightMotionProvider`; `src/app/[locale]/layout.tsx` imports only `PageTransition`, which is pure CSS (no `motion/react` import).

**Files:**
- Modify: `tests/architecture/homepage-lcp-motion-boundary.test.ts` (full replacement below)
- Modify: `.dependency-cruiser.js` (add one rule)

- [ ] **Step 1: Replace the entire test file content with:**

```ts
import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SINGLE_SITE_HOME_SECTION_ORDER } from "@/config/single-site-page-expression";
import { lightBreathingItemVariants } from "@/lib/motion/light-breathing";

// Local-wrapper graph enforcement for the motion boundary lives in
// .dependency-cruiser.js ("no-motion-wrapper-outside-home", severity error,
// wired into CI and lefthook). dependency-cruiser excludes node_modules from
// its graph, so direct motion/react and framer-motion imports are guarded by
// the specifier scan below instead.
const FORBIDDEN_MOTION_SPECIFIERS = ["motion/react", "framer-motion"] as const;
const ALLOWED_MOTION_PREFIXES = [
  "src/app/[locale]/page.tsx",
  "src/components/motion/",
  "src/lib/motion/",
  "src/test/",
] as const;
const EXCLUDED_FILE_PATTERN = /\.(?:test|spec|stories)\.(?:ts|tsx)$/;
const IMPORT_SPECIFIER_PATTERN =
  /\b(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;

function findForbiddenMotionImports(source: string): string[] {
  return [...source.matchAll(IMPORT_SPECIFIER_PATTERN)]
    .map((match) => match[1] ?? "")
    .filter((specifier) =>
      FORBIDDEN_MOTION_SPECIFIERS.some(
        (forbidden) =>
          specifier === forbidden || specifier.startsWith(`${forbidden}/`),
      ),
    );
}

describe("homepage LCP motion boundary", () => {
  it("keeps breathing reveal content visible before client motion activates", () => {
    const hidden: Record<string, unknown> = lightBreathingItemVariants.hidden;

    expect(hidden).not.toHaveProperty("opacity");
    expect(hidden).not.toHaveProperty("visibility");
    expect(hidden).not.toHaveProperty("display");
  });

  it("keeps the hero as the first home section", () => {
    expect(SINGLE_SITE_HOME_SECTION_ORDER[0]).toBe("hero");
  });

  it("keeps motion/react and framer-motion out of non-approved src files", () => {
    const sourceFiles = [
      ...globSync("src/**/*.ts"),
      ...globSync("src/**/*.tsx"),
    ];
    const offenders = sourceFiles
      .filter((file) => !EXCLUDED_FILE_PATTERN.test(file))
      .filter(
        (file) =>
          !ALLOWED_MOTION_PREFIXES.some((prefix) => file.startsWith(prefix)),
      )
      .flatMap((file) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads files discovered under src
        const source = readFileSync(file, "utf8");
        return findForbiddenMotionImports(source).map(
          (specifier) => `${file} -> ${specifier}`,
        );
      });

    expect(offenders).toEqual([]);
  });

  it("detects forbidden motion specifiers (parser self-check)", () => {
    expect(
      findForbiddenMotionImports('import { motion } from "motion/react";\n'),
    ).toEqual(["motion/react"]);
    expect(
      findForbiddenMotionImports('const m = await import("framer-motion");\n'),
    ).toEqual(["framer-motion"]);
  });
});
```

(The self-check proves the specifier parser recognizes static and dynamic imports. No real page is modified.)

- [ ] **Step 2: Add the dep-cruiser rule (local wrappers only)**

In `.dependency-cruiser.js`, add to the `forbidden` array (after the `no-circular` rule):

```js
{
  name: "no-motion-wrapper-outside-home",
  severity: "error",
  comment:
    "LCP 首屏边界：非首页不得进入本地 motion wrapper 图（历史证明：docs/技术难题/LCP首屏动效边界.md；motion/react 直接导入由 homepage-lcp-motion-boundary.test.ts 守护）",
  from: {
    path: "^src/",
    pathNot:
      "^src/(app/\\[locale\\]/page\\.tsx$|components/motion/|lib/motion/|test/)",
  },
  to: {
    path: "^src/components/motion/(breathing-reveal|light-motion-provider)",
  },
},
```

(`PageTransition` is deliberately NOT in the `to` set — it is pure CSS and the locale layout legitimately imports it. Do NOT add `node_modules` paths to `to` — they are excluded from the graph and would silently never match.)

- [ ] **Step 3: Prove the rule passes on clean source AND fires on a violation (probe is a NEW file, no real page is touched)**

```bash
pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err
```
Expected: exit 0. Then inject the probe:

```bash
printf 'import "@/components/motion/breathing-reveal";\n' > src/motion-rule-probe.ts
pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err; echo "exit=$?"
mkdir -p "$HOME/.Trash"
mv src/motion-rule-probe.ts "$HOME/.Trash/motion-rule-probe.ts.$(date +%s)"
```
Expected: output contains `no-motion-wrapper-outside-home` and exit is non-zero; the probe then goes to Trash. If the rule does NOT fire, STOP — inspect the resolved module paths with `pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T text | grep motion` and fix the rule before proceeding. Deleting the old 579-line test without a proven-firing replacement guard is not allowed.

- [ ] **Step 4: Verify and commit**

```bash
pnpm exec vitest run tests/architecture/homepage-lcp-motion-boundary.test.ts
pnpm lint:check
git add -- tests/architecture/homepage-lcp-motion-boundary.test.ts .dependency-cruiser.js
git commit -m "test: split homepage motion boundary into behavior checks and layered guards"
```

### Task 12: Batch 2 gate, push, PR

- [ ] **Step 1: Full local gate (this batch touches `src/components/ui/*` and client components, so the UI hard gate and React Doctor are mandatory, not optional — `component:check` includes the Storybook build that `pnpm build` does not cover)**

```bash
pnpm website:check
pnpm component:check
pnpm react:doctor
pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err
```
Expected: all green. React Doctor errors block; warnings are backlog unless this batch introduced them.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin chore/overengineering-cleanup-2
gh pr create --title "chore: overengineering cleanup batch 2 (consolidation)" \
  --body "Batch 2 of docs/superpowers/plans/2026-07-19-overengineering-cleanup.md: single SocialIconLink protocol, retire footer style tokens (incl. globals.css @source + rule-doc sync), trim lead-write-endpoint to the live graph proof, replace 579-line motion AST test with 2 behavior checks + layered guards (dep-cruiser for local wrappers, specifier scan for direct motion imports)."
```

- [ ] **Step 3: Wait for exact-SHA CI, Cursor self-review, and Codex acceptance**

Cursor stops at `READY_FOR_ACCEPTANCE` and never merges. Codex reviews the complete Batch 2 diff and evidence. If `ACCEPTED`, Codex merges the PR, verifies updated `origin/main`, removes the Batch 2 worktree, and starts Batch 3 from that exact main SHA.

---

# Batch 3 — truth-docs gate rework

Branch: `chore/overengineering-cleanup-3` (from updated `main`)

This batch touches the CI gate itself (`node scripts/starter-checks.js truth-docs`, CI step "Current truth docs check"). Scope: delete the per-doc phrase pinning (`TRUTH_DOC_CHECKS` required/forbidden string lists — point-in-time wording snapshots the Gate Discipline rule forbids) and the ~130-line bilingual clause-grammar negation parser. Keep every structural check: doc inventory gate (`> Historical.` banner machinery), backticked-path existence, guardrail exception registry, rule frontmatter globs, `pnpm <script>` command existence, and the release-proof runbook block sync.

### Task 13: Rework the check script

**Files:**
- Modify: `scripts/quality/checks/current-truth-docs.js`
- Modify: `scripts/starter-checks.js` (two `CHECKS: TRUTH_DOC_CHECKS` sites, lines ~69 and ~213)
- Modify: `.claude/rules/cloudflare.md` (mark the intentionally absent `src/proxy.ts`)
- Modify: `.claude/rules/code-quality.md` (mark the intentionally absent `src/testing/**` and `src/constants/test-*` patterns)

**Interfaces:**
- Produces: `REQUIRED_TRUTH_FILES: string[]` (replaces the exported `CHECKS`); `lineAllowsMissingDocumentedPath(content, lineStart, matchIndex): boolean` (replaces `isNegatedDocumentedPath` — same signature, one call site in `collectBacktickedRepoPathFindings` renamed).

- [ ] **Step 1: Confirm the anchor-file list BEFORE editing**

```bash
node -e "const {CHECKS}=require('./scripts/quality/checks/current-truth-docs');console.log(JSON.stringify([...new Set(CHECKS.map(c=>c.file))],null,2))"
```
Expected: the output exactly matches the `REQUIRED_TRUTH_FILES` list in Step 2. If it differs because `main` changed after this plan was written, STOP and update the explicit list before editing the check.

- [ ] **Step 2: Replace the phrase-pin array with an existence list**

Delete the entire `const TRUTH_DOC_CHECKS = [ ... ];` array (currently lines 50–366) and insert the exact list confirmed in Step 1:

```js
// 锚点文档必须存在；措辞不再钉死 —— 措辞真相由文档清单与路径存在性检查守护。
const REQUIRED_TRUTH_FILES = [
  "docs/项目基础/文档清单.md",
  "docs/README.md",
  "README.md",
  "docs/项目基础/AI协作边界.md",
  "docs/项目基础/维护入口.md",
  "docs/技术难题/性能实验优化方法论.md",
  "docs/项目基础/项目基础索引.md",
  "docs/决策记录/Radix联系表单试点.md",
  "docs/技术难题/验证入口.md",
  "docs/技术难题/性能记录.md",
  "docs/项目基础/维护规则.md",
  "docs/项目基础/内容.md",
  "docs/项目基础/项目基础.md",
  "docs/项目基础/消息文案.md",
  "docs/项目基础/替换边界.md",
  "docs/项目基础/配置.md",
  "docs/项目基础/发布验证.md",
  "docs/项目基础/验证等级.md",
  "docs/项目基础/架构图.svg",
  "docs/项目基础/生命周期.md",
  "docs/design/色彩系统.md",
  "docs/design/组件治理.md",
  "docs/design/设计真相.md",
  "docs/design/动效治理.md",
  "docs/design/设计系统说明.md",
  "docs/design/页面模式.md",
  "docs/技术难题/全量性能审计.md",
  "docs/技术难题/LCP首屏动效边界.md",
  "docs/技术难题/Lighthouse预算治理.md",
  "docs/技术难题/Lighthouse预取策略.md",
  "docs/技术难题/Lighthouse产品详情负载.md",
  "docs/技术难题/Lighthouse共享负载.md",
  "docs/技术难题/Lighthouse黄色债务归因.md",
  "docs/技术难题/Lighthouse黄色债务基线.md",
  "docs/技术难题/Lighthouse黄色债务第一轮收口.md",
  "docs/技术难题/Lighthouse黄色债务第二轮基线.md",
  "docs/技术难题/Lighthouse黄色债务第二轮收口.md",
  "docs/技术难题/Lighthouse零黄色归因.md",
  "docs/技术难题/性能治理候选审计.md",
  "docs/技术难题/SEO公开页面性能余量.md",
  ".claude/rules/content.md",
  ".claude/rules/i18n.md",
  ".claude/rules/testing.md",
];
```

In `collectCurrentTruthDocFindings`, replace the whole `for (const check of TRUTH_DOC_CHECKS) { ... }` loop with:

```js
for (const file of REQUIRED_TRUTH_FILES) {
  if (!fs.existsSync(path.join(rootDir, file))) {
    failures.push({
      file,
      error: `missing required current-truth file "${file}"`,
    });
  }
}
```

- [ ] **Step 3: Replace the clause-grammar negation parser with an explicit allow-missing marker**

Natural-language inference is dropped entirely — in BOTH directions. A negation-word heuristic would create real misses: a line like `.claude/rules/cloudflare.md:70` ("Do not rename `src/middleware.ts` to `src/proxy.ts` ...") mixes a live path and an intentionally-absent path, and skipping the whole line would stop guarding the live one. New rule: **every backticked `src/`/`tests/` path must exist unless its line carries an explicit `truth-docs:allow-missing` marker.**

Delete the block from `const PATH_INSTRUCTION_VERB_SOURCE = ...` down through the end of `function isNegatedDocumentedPath(...)` (currently ~lines 513–645, including `POSITIVE_PATH_STATE_SOURCE`, `ABSENCE_PERMITTING_*`, `NEGATIVE_MODAL_SOURCE`, `NEGATED_*_PATTERN`, `CHINESE_*_PATTERN`, `NEGATED_STATE_PREFIX_PATTERN`, `NEGATIVE_PATH_PREDICATE_PATTERN`, `POSITIVE_PATH_PREDICATE_PATTERN`, `commaBelongsToNegatedActionList`, `isNegatedByDirective`, `isNegatedDocumentedPath`). Insert in its place:

```js
// 显式豁免：默认所有反引号 src/tests 路径都必须存在；只有行内带
// truth-docs:allow-missing 标记（HTML 注释形式）的行允许路径缺失。
// 混合句（同行既有活路径又有故意缺失路径）应拆句后再打标记。
const ALLOW_MISSING_MARKER = "truth-docs:allow-missing";

function lineAllowsMissingDocumentedPath(content, lineStart, matchIndex) {
  const lineEnd = content.indexOf("\n", matchIndex);
  const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return line.includes(ALLOW_MISSING_MARKER);
}
```

Then in `collectBacktickedRepoPathFindings`, change the call site `if (isNegatedDocumentedPath(content, lineStart, match.index))` to `if (lineAllowsMissingDocumentedPath(content, lineStart, match.index))`.

- [ ] **Step 3b: Sweep current docs and mark intentionally-absent paths**

Run the gate; each new finding is a doc line whose missing path used to be excused by the old grammar parser:

```bash
node scripts/starter-checks.js truth-docs
```

For each finding, decide per path:
- **Path intentionally absent** (retired/forbidden file): append ` <!-- truth-docs:allow-missing -->` at the end of that line. If the same line ALSO contains a live path that is not positively referenced on another checked line, split the sentence first so the marker only covers the absent path.
- **Path is a stale reference**: fix the doc instead of marking.

The current `main` produces exactly three intentional-missing findings. Apply these explicit edits:

`.claude/rules/cloudflare.md` — replace the mixed-path sentence with:

```markdown
Do not introduce `src/proxy.ts` in this starter. <!-- truth-docs:allow-missing -->
Cloudflare/OpenNext support is not acceptable for a blind migration.
```

The live `src/middleware.ts` remains guarded by the preceding sentence, "Keep `src/middleware.ts` as the runtime entrypoint."

`.claude/rules/code-quality.md` — split the three forbidden import surfaces so only the intentionally absent patterns are marked:

```markdown
Production code must not import `src/test/**`.
Production code must not import `src/testing/**`. <!-- truth-docs:allow-missing -->
Production code must not import `src/constants/test-*`. <!-- truth-docs:allow-missing -->
```

Re-run the gate. Expected: no other missing-path findings. If another file appears because `main` changed, STOP, classify that path, add the exact file to this task's Files list and commit command, then continue.

- [ ] **Step 4: Fix the exports**

In `current-truth-docs.js` `module.exports`, replace `CHECKS: TRUTH_DOC_CHECKS,` with `REQUIRED_TRUTH_FILES,`.

In `scripts/starter-checks.js`, update both sites: the destructured require (`CHECKS: TRUTH_DOC_CHECKS,` → `REQUIRED_TRUTH_FILES,`) and the `module.exports` (`CHECKS: TRUTH_DOC_CHECKS,` → `REQUIRED_TRUTH_FILES,`). Then confirm no other consumer remains:

```bash
grep -rn "TRUTH_DOC_CHECKS\|\bCHECKS\b" scripts tests --include="*.js" --include="*.ts" | grep -v REQUIRED_TRUTH_FILES
```
Any remaining hit (outside the test file handled in Task 14) must be updated the same way.

- [ ] **Step 5: Final gate run**

```bash
node scripts/starter-checks.js truth-docs
```
Expected: `current-truth-docs: passed` (the Step 3b sweep already resolved every finding — this run must be clean with no further edits).

- [ ] **Step 6: Commit (list every doc line marked in Step 3b in the message body)**

```bash
git add -- \
  scripts/quality/checks/current-truth-docs.js \
  scripts/starter-checks.js \
  .claude/rules/cloudflare.md \
  .claude/rules/code-quality.md
git commit -m "refactor: replace truth-docs phrase pinning with structural checks"
```

### Task 14: Rework the check's unit tests

**Files:**
- Modify: `tests/unit/scripts/current-truth-docs.test.ts` (897 lines today; large parts test deleted machinery)

- [ ] **Step 1: Delete tests of deleted machinery**

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
```
It will fail on imports/cases referencing `CHECKS` and the old parser. Then:
- replace the imported `CHECKS` name with `REQUIRED_TRUTH_FILES`;
- in `createValidFiles()`, replace the `for (const check of CHECKS) { ... }` block with:

```ts
for (const file of REQUIRED_TRUTH_FILES) {
  files[file] = "safe baseline text";
}
```

- delete these phrase-pinning test blocks in full:
  - `keeps design docs bounded to Tucsenberg and historical workflow truth`;
  - `keeps docs existence review closed instead of leaving review-needed buckets`;
  - `treats the 2026-07 audit handoff as historical, not snapshot-pinned truth`;
  - the whole `current-truth docs product ownership markers` describe block containing `guards stable docs from naming legacy specs as current product truth`;
- delete every `it` case that asserts clause-grammar subtleties of the old negation parser (cases exercising coordinated clauses, passive renames, `instead`-comma resets, etc.) AND every case that expects plain negation wording to exempt a missing path — the semantics are deliberately inverted (only the marker exempts now; Step 2 adds the test that locks this in);
- keep every case for the collectors that survived: inventory gate, historical banner, guardrail registry, rule frontmatter globs, command existence, runbook block.

- [ ] **Step 2: Add focused tests for the new behavior**

The file already has mature fixture helpers — `createTempRepo(files)` (line ~19), `createValidFiles()` (line ~85), and `moveTempRepoToTrash(dir)` (line ~70). Reuse them; do NOT introduce a parallel fixture system. Add inside the main `describe`:

```ts
it("keeps flagging documented src paths that do not exist", () => {
  const repoDir = createTempRepo({
    "doc.md": "Use `src/lib/definitely-missing.ts` for X.\n",
  });
  try {
    expect(collectBacktickedRepoPathFindings(repoDir, ["doc.md"])).toHaveLength(
      1,
    );
  } finally {
    moveTempRepoToTrash(repoDir);
  }
});

it("skips missing paths only on lines with the allow-missing marker", () => {
  const repoDir = createTempRepo({
    "doc.md":
      "Do not create `src/lib/definitely-missing.ts` <!-- truth-docs:allow-missing -->.\n",
  });
  try {
    expect(collectBacktickedRepoPathFindings(repoDir, ["doc.md"])).toEqual([]);
  } finally {
    moveTempRepoToTrash(repoDir);
  }
});

it("does not exempt a missing path from negation wording alone", () => {
  const repoDir = createTempRepo({
    "doc.md": "不要创建 `src/lib/definitely-missing.ts`。\n",
  });
  try {
    expect(collectBacktickedRepoPathFindings(repoDir, ["doc.md"])).toHaveLength(
      1,
    );
  } finally {
    moveTempRepoToTrash(repoDir);
  }
});

it("reports required truth files that are missing", () => {
  const files = createValidFiles();
  const target = REQUIRED_TRUTH_FILES[0];
  if (!target) throw new Error("REQUIRED_TRUTH_FILES must not be empty");
  delete files[target];
  const repoDir = createTempRepo(files);
  try {
    const findings = collectCurrentTruthDocFindings(repoDir);
    expect(
      findings.some((f) =>
        f.error.includes(`missing required current-truth file "${target}"`),
      ),
    ).toBe(true);
  } finally {
    moveTempRepoToTrash(repoDir);
  }
});
```

(These snippets match the current helper signatures. The third test locks in the semantics change: negation wording no longer exempts anything; only the marker does.)

- [ ] **Step 3: Verify everything**

```bash
pnpm exec vitest run tests/unit/scripts/current-truth-docs.test.ts
pnpm test
node scripts/starter-checks.js truth-docs
```
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add -- tests/unit/scripts/current-truth-docs.test.ts
git commit -m "test: cover truth-docs structural checks and explicit missing-path markers"
```

### Task 15: Batch 3 gate, push, PR

- [ ] **Step 1: Full local gate (re-run the reworked gate explicitly — it is the subject of this PR, not a bystander)**

```bash
pnpm website:check
node scripts/starter-checks.js truth-docs
```
Expected: all green, including `current-truth-docs: passed`.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin chore/overengineering-cleanup-3
gh pr create --title "refactor: overengineering cleanup batch 3 (truth-docs gate)" \
  --body "Batch 3 of docs/superpowers/plans/2026-07-19-overengineering-cleanup.md: truth-docs gate keeps every structural check (doc inventory, path existence, guardrail registry, command existence, runbook sync) and drops per-doc phrase pinning + the clause-grammar negation parser, replaced by an explicit truth-docs:allow-missing marker (default: documented paths must exist). Per Gate Discipline: guards protect live truth, not wording snapshots."
```

- [ ] **Step 3: Wait for exact-SHA CI, Cursor self-review, and Codex acceptance**

Cursor stops at `READY_FOR_ACCEPTANCE` and never merges. Codex reviews the complete Batch 3 diff and evidence. If `ACCEPTED`, Codex merges the PR, verifies updated `origin/main`, removes the Batch 3 worktree, and records the cleanup sequence as closed.

This closes the three cleanup batches. One deliberate leftover for the record: `useLeadFormSubmission` still carries its generic config surface with a single production consumer — this round removed only its AST identity gates; whether to narrow the hook is deferred to a separate cross-layer refactor decision (see Deliberate Deviations #1). Do not report it as resolved.
