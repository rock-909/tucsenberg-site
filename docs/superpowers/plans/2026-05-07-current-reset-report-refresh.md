# Current Reset Report Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the current reset report so it reflects the latest script/workflow cleanup state.

**Architecture:** Treat `docs/superpowers/current/starter-review-pro-reset-final-report.md` as the live summary. Update only measured metrics and follow-up notes; leave historical proof commands as proof history unless they are stated as current canonical commands.

**Tech Stack:** Markdown documentation, existing truth-doc and proof-lane Vitest guardrails.

---

## File structure

- Modify: `docs/superpowers/current/starter-review-pro-reset-final-report.md`
  - Update date note, measured after-state metrics, script cleanup notes, and follow-up verification.

## Task 1: Recompute current metrics

**Files:**
- No edits.

- [ ] **Step 1: Run metric script**

Run:

```bash
node - <<'NODE'
const fs=require('fs');
const path=require('path');
function walk(dir){let out=[]; if(!fs.existsSync(dir)) return out; for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name); if(ent.isDirectory()) out=out.concat(walk(p)); else out.push(p);} return out;}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const workflows=walk('.github/workflows').filter(f=>/\.ya?ml$/.test(f));
const scriptFiles=walk('scripts');
const srcTs=walk('src').filter(f=>/\.(ts|tsx)$/.test(f));
const libTs=walk('src/lib').filter(f=>/\.(ts|tsx)$/.test(f));
const leadTs=walk('src/lib/lead-pipeline').filter(f=>/\.(ts|tsx)$/.test(f));
console.log(JSON.stringify({
  scripts:Object.keys(pkg.scripts||{}).length,
  workflowCount:workflows.length,
  scriptFileCount:scriptFiles.length,
  srcTs:srcTs.length,
  libTs:libTs.length,
  leadTs:leadTs.length,
  scriptFiles:scriptFiles.map(f=>f.replace(/^.\//,'')).sort()
}, null, 2));
NODE
```

Expected current values:

```json
{
  "scripts": 14,
  "workflowCount": 2,
  "scriptFileCount": 1,
  "srcTs": 686,
  "libTs": 173,
  "leadTs": 9,
  "scriptFiles": ["scripts/starter-checks.js"]
}
```

## Task 2: Update current report

**Files:**
- Modify: `docs/superpowers/current/starter-review-pro-reset-final-report.md`

- [ ] **Step 1: Update date line**

Replace:

```md
Date: 2026-05-06
```

with:

```md
Date: 2026-05-06
Refreshed: 2026-05-07 after script/doc guard cleanup waves
```

- [ ] **Step 2: Update scorecard after-state values**

Replace the relevant rows with:

```md
| `src` TS/TSX files | 722 | 686 |
| `src/lib` TS/TSX files | 208 | 173 |
| `src/lib/lead-pipeline` TS/TSX files | 31 | 9 |
| `package.json` scripts | 142 | 14 |
| `.github/workflows` files | 5 | 2 |
| `scripts/` files | 78 | 1 |
```

Keep rows whose latest value is not being refreshed only if they are still clearly historical. Do not invent a new repo file count without a stable count method.

- [ ] **Step 3: Replace notes**

Replace:

```md
- `scripts/` count stays flat because flat-translation scripts were removed while split-translation and health-contract support were added.
```

with:

```md
- `package.json` now exposes 14 public scripts.
- `scripts/` now has a single physical entrypoint: `scripts/starter-checks.js`.
```

- [ ] **Step 4: Add follow-up cleanup notes**

Under `### Removed or simplified`, add:

```md
- Top-level package scripts were pruned to the starter-facing command surface.
- Legacy script files were consolidated into `scripts/starter-checks.js`.
- Current starter-facing docs now have guard coverage against retired command names.
- Vercel deployment artifacts are covered by an anti-regression guard.
```

- [ ] **Step 5: Add follow-up verification block**

After the existing verification bundle, add:

```md
Follow-up cleanup verification on 2026-05-07:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
pnpm exec vitest run tests/unit/scripts/component-governance-check.test.ts tests/architecture/component-governance.test.ts
node scripts/starter-checks.js truth-docs
pnpm component:check
pnpm type-check
pnpm lint:check
```
```

## Task 3: Verify

**Files:**
- No extra edits expected.

- [ ] **Step 1: Run truth-doc guard**

Run:

```bash
node scripts/starter-checks.js truth-docs
```

Expected: PASS.

- [ ] **Step 2: Run focused report-related tests**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint:check
```

Expected: PASS.
