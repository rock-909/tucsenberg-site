# Current-Only Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Reduce the repository to a current-only documentation system with one source of truth per long-term responsibility, a five-file design governance set, and a flat root plans/ process area.

**Architecture:** Synchronize with origin/main first. Build canonical documents from surviving current material before retiring old files. Move machine baselines beside their checkers, update every path and gate reference, and move historical material to Trash instead of creating an archive.

**Tech Stack:** Markdown, Git, pnpm, Vitest, ESLint, Next.js/Cloudflare checks, rg and git verification.

**Design spec:** plans/2026-07-29-current-only-documentation-design.md

---

## Global Constraints

- Do not modify production behavior, public copy, routing, or deployment semantics.
- Do not permanently delete files; move retired files to Trash first, then stage deletions.
- Do not create docs/archive/, plans/spec/, plans/specs/, plans/plans/, a document registry, or .gitkeep files.
- docs/ must end with exactly 14 Markdown files: 9 top-level files and 5 under docs/design/.
- Root plans/ is only for unfinished current Superpowers process files and is not product truth.
- release:verify, PR CI, deployed smoke, real-service canary, and owner receipt remain separate proof levels.
- The client-boundary budget remains enforced after moving out of docs/.
- origin/main must be rechecked before the first migration edit.

## File Structure

Canonical files:

~~~text
docs/README.md
docs/项目.md
docs/技术栈.md
docs/架构与行为.md
docs/内容与品牌.md
docs/开发与维护.md
docs/正式上线标准.md
docs/技术问题与演进.md
docs/技术决策.md
docs/design/设计真相.md
docs/design/设计系统.md
docs/design/组件治理.md
docs/design/页面模式.md
docs/design/动效治理.md
~~~

Machine-consumed data moves to:

~~~text
scripts/quality/config/client-boundary-budget.json
~~~

## Task 1: Synchronize baseline and build canonical project documents

**Files:**
- Read: AGENTS.md, the approved design spec, docs/README.md, docs/项目基础/*.md, docs/技术难题/*.md, docs/决策记录/*.md
- Create or replace: the nine top-level canonical files listed above
- Modify only as needed: AGENTS.md, CLAUDE.md, README.md, DESIGN.md, PRODUCT.md

- [ ] **Step 1: Refresh main before edits**

Run:

~~~bash
git fetch origin main
git rev-parse origin/main
git rev-list --count HEAD..origin/main
git status --short --branch
~~~

If behind, merge origin/main into this worktree and resolve only support-layer conflicts. Run git diff --check before continuing. Never reset or discard unrelated changes.

- [ ] **Step 2: Write the nine canonical files**

Keep current facts and operating rules only. Preserve: English-only routes, content-as-code ownership, the single inquiry chain, Cloudflare/OpenNext build distinction, strict public-launch proof, owner receipt, and lockfile/configuration as technology truth.

Run:

~~~bash
for f in docs/README.md docs/项目.md docs/技术栈.md docs/架构与行为.md docs/内容与品牌.md docs/开发与维护.md docs/正式上线标准.md docs/技术问题与演进.md docs/技术决策.md; do test -s "$f" || exit 1; done
~~~

- [ ] **Step 3: Add CI and gate role explanations**

In docs/开发与维护.md, explain every active CI/gate family with four fields: protected intent, execution entry, failure meaning, and what it cannot prove. Cover formatting/lint/type, unit/integration/E2E, component governance, content/i18n, dependency/architecture, Cloudflare/OpenNext build, release proof, strict production config, deployed smoke, and real inquiry/owner receipt.

In docs/正式上线标准.md, keep local proof, PR CI, Cloudflare build/deploy, public runtime proof, and owner signoff as separate levels.

- [ ] **Step 4: Validate canonical docs**

Run:

~~~bash
rg -n "TBD|TODO|docs/superpowers|docs/plans|plans/README|文档清单" docs/README.md docs/项目.md docs/技术栈.md docs/架构与行为.md docs/内容与品牌.md docs/开发与维护.md docs/正式上线标准.md docs/技术问题与演进.md docs/技术决策.md
~~~

Expected: no stale process-path or historical-registry language.

- [ ] **Step 5: Commit**

~~~bash
git add docs AGENTS.md CLAUDE.md README.md DESIGN.md PRODUCT.md
git commit -m "docs: establish current project documentation"
~~~

## Task 2: Compress design governance to five files

**Files:**
- Create or replace: docs/design/设计真相.md, docs/design/设计系统.md, docs/design/组件治理.md, docs/design/页面模式.md, docs/design/动效治理.md
- Modify: AGENTS.md, .claude/rules/ui.md, DESIGN.md, src/components/ui/README.md, tests/architecture/ui-component-playbook.test.ts, and source comments pointing to retired design files
- Retire old design files only after replacements and references are verified

- [ ] **Step 1: Write the five canonical design files**

Keep current visual truth, Direction E decision, and unresolved implementation constraints in 设计真相.md. Merge color/token/grid rules into 设计系统.md; component manual and Storybook responsibility into 组件治理.md; page patterns and valid visual translation rules into 页面模式.md; motion principles into 动效治理.md.

- [ ] **Step 2: Update design entry pointers**

Replace docs/design/组件使用手册.md with docs/design/组件治理.md and point retired token, grid, motion-principle, visual-translation, and migration-asset references to the canonical owner.

- [ ] **Step 3: Remove document-name coupling**

Change tests/architecture/ui-component-playbook.test.ts to verify the current component governance entry and actual required rules, not the retired manual filename or a duplicated inventory.

- [ ] **Step 4: Verify**

Run:

~~~bash
pnpm exec vitest run tests/architecture/ui-component-playbook.test.ts
rg -n "组件使用手册|Storybook覆盖范围|动效原则|设计令牌|色彩系统|网格系统|视觉翻译|可迁移设计资产|方向E-首页样稿" AGENTS.md CLAUDE.md DESIGN.md PRODUCT.md .claude src tests docs
~~~

Remaining matches must be historical notes or valid canonical links.

- [ ] **Step 5: Commit**

~~~bash
git add docs/design AGENTS.md .claude/rules/ui.md DESIGN.md src/components/ui/README.md tests/architecture/ui-component-playbook.test.ts src
git commit -m "docs: consolidate design governance"
~~~

## Task 3: Move machine data and migrate path/gate references

**Files:**
- Create: scripts/quality/config/client-boundary-budget.json
- Modify: scripts/quality/checks/client-boundary.js, tests/unit/scripts/client-boundary-budget.test.ts, .gitignore, .claude/skills/behavior-driven-development/SKILL.md, .claude/rules/content.md, AGENTS.md, CLAUDE.md, and remaining current path pointers
- Retire: docs/技术难题/客户端边界预算.json after the new path passes

- [ ] **Step 1: Move the budget unchanged**

Create scripts/quality/config/client-boundary-budget.json byte-for-byte from the existing JSON. Change only checker and test path constants; do not change budget values.

- [ ] **Step 2: Prove enforcement**

Run:

~~~bash
pnpm exec vitest run tests/unit/scripts/client-boundary-budget.test.ts
node scripts/quality/checks/client-boundary.js
~~~

Only after both pass, move the old JSON to Trash and stage its deletion.

- [ ] **Step 3: Switch project Superpowers guidance**

Make current project instructions and local workflow references use:

~~~text
plans/YYYY-MM-DD-<topic>-design.md
plans/YYYY-MM-DD-<topic>-plan.md
~~~

Remove claims that root plans/ is permanently retired or docs/superpowers/ is the current project output. Do not edit global plugin files.

- [ ] **Step 4: Scan retired paths**

Run:

~~~bash
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' "docs/superpowers|docs/plans|docs/技术难题/客户端边界预算|组件使用手册|plans/README|plans/handoff-report" .
~~~

No active path may depend on a retired file.

- [ ] **Step 5: Commit**

~~~bash
git add scripts/quality/config scripts/quality/checks/client-boundary.js tests/unit/scripts/client-boundary-budget.test.ts .gitignore .claude AGENTS.md CLAUDE.md docs/技术难题/客户端边界预算.json
git commit -m "chore: move documentation support paths"
~~~

## Task 4: Retire historical material and final proof

**Files:**
- Retire to Trash: remaining docs/superpowers/**, old root plans/**, historical audit packages, old design files, redundant project docs outside the target tree
- Inspect: untracked docs/技术难题/整库审查2026-07-26/
- Modify only if final scans expose a current pointer

- [ ] **Step 1: Classify before moving**

For every remaining Markdown, JSON, TSV, evidence, or image outside the target tree, search current callers, rules, tests, and runtime consumers. Move unique current facts into their canonical owner first. No consumer and no unique future decision value means retirement candidate.

- [ ] **Step 2: Move retired material safely**

Use a timestamped directory under the user Trash location. Never use rm, git clean, unlink, or equivalent. Then stage tracked deletions. Do not create an in-repo archive or historical index.

- [ ] **Step 3: Verify target tree**

Run:

~~~bash
test "$(find docs -type f -name '*.md' | wc -l | tr -d ' ')" -eq 14
test "$(find docs/design -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -eq 5
test ! -d docs/superpowers
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' "docs/superpowers|docs/plans|plans/README|整库审查2026-07-26|整库审查full-audit|门禁断言审查" .
~~~

The first three assertions must pass; the final search must have no active current reference.

- [ ] **Step 4: Run minimum verification serially**

~~~bash
pnpm exec vitest run tests/architecture/ui-component-playbook.test.ts tests/unit/scripts/client-boundary-budget.test.ts tests/architecture/env-example-parity.test.ts
pnpm type-check
pnpm lint:check
pnpm website:check
~~~

Use exact script names from package.json after main synchronization if any name changed; do not silently skip checks.

- [ ] **Step 5: Review production scope**

Run:

~~~bash
git diff --name-only origin/main...HEAD
git diff --stat origin/main...HEAD
git diff --check
git status --short --branch
~~~

Only docs, instructions, tests, checkers, and the machine baseline may change. No src/app, src/components behavior, content/pages, messages, or deployment behavior may change.

- [ ] **Step 6: Commit**

~~~bash
git add -A
git commit -m "docs: retire historical support material"
~~~

## Completion Gate

Before claiming completion, verify the exact target tree, focused tests, type-check, lint, and website:check. Report unavailable GitHub or Cloudflare enforcement as unverified; local green is not external proof.
