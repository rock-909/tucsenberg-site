# AGENTS.md

## Project

**tucsenberg-site** - derived English B2B website for Tucsenberg flood barrier products.

**Goal**: Maintain the current Tucsenberg flood barrier website: English-only product discovery, OEM / wholesale inquiry conversion, specification evaluation, PDF download, and Cloudflare/OpenNext deployment.

It is not a generic starter anymore. Runtime profile selection, profile fixtures, the old blog source, and materialization tooling have been retired. The site currently ships English only; the i18n framework stays in place and more locales will be added later. Inherited starter naming survives only in checks, compatibility filenames, or clearly marked history.

## Communication

The owner is non-technical. Communicate in business language, not technical jargon.

## Tucsenberg Site Docs

Before making broad project changes, read:

1. `docs/README.md`
2. `docs/项目基础/项目基础.md`
3. `docs/项目基础/内容.md`
4. `docs/项目基础/AI协作边界.md`

Do not rely on chat memory for project truth. If a decision must survive sessions, write it into `docs/项目基础/`, `docs/design/`, `docs/技术难题/`, `docs/决策记录/`, or the relevant rule file.

## Reference Sources

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

For other dependency-specific work, prefer official docs or version-locked local docs. Verify dependency APIs from current docs before editing.

## Rules

Before editing, read the matching rule file under `.claude/rules/` — each file's `paths:` frontmatter states what it governs, and each file carries its own pointers to the deeper design and decision docs.

## Validation

`pnpm build` and `pnpm website:build:cf` write to the same `.next` directory - never run them in parallel.

Use the smallest validation that proves the change:

- Type-only changes: `pnpm type-check`
- Lint-sensitive edits: `pnpm lint:check`
- Unit-tested logic: `pnpm test`
- Next.js/runtime changes: `pnpm build`
- Cloudflare/OpenNext changes: run `pnpm build` before `pnpm website:build:cf`
- Broad local app checks: `pnpm website:check`
- Release-facing changes: follow `docs/项目基础/上线验证.md` and `pnpm release:verify`

## Constraints

1. **i18n required** - All user-facing text via translation keys
2. **Git** - GitHub Flow: `main` is the only long-lived branch; feature branches merge through pull requests.

## Correctness and Bug-Fix Discipline

Do not use ROI, effort, cost, "low value", "edge case", or "not worth it" as reasons to leave a confirmed wrong state unfixed. If something is proven wrong, treat it as wrong. Competitors, references, or previous examples making the same mistake do not make it acceptable.

Scope and sequencing can affect when and how a fix is delivered, but not whether the defect is real. If a confirmed issue is not fixed in the current change, state the actual reason: out of scope, blocked, requires a separate change, or has a proven feasibility limit. Also name the remaining root cause or follow-up.

Before fixing a bug, diagnose why the current structure allowed it to happen and whether it represents a broader class of bugs. Prefer fixes that remove the enabling condition for that class, rather than patches that only hide the symptom. Use a symptom-level patch only when the structural fix is genuinely infeasible, blocked, or belongs in a separate change, and say which root cause is being deferred.

## Gate Discipline

Gates, tests, and checks are heuristics serving an intent, not laws. When a
check forces docs or code to state something false, fix the check, not the
statement. Never pin point-in-time snapshots (commit hashes, check output
counts, push status) as required assertions. New guards must protect live
truth, not the negative space of past refactors (e.g. asserting that deleted
names stay absent).

Instruction files are not a place for machine-enforced content assertions. Do
not add tests or checks that require `AGENTS.md` or `CLAUDE.md` to contain a
specific sentence; guard the behavior those sentences describe instead.

## AI-assisted Frontend System

Governance truth: `docs/design/组件使用手册.md`, `docs/design/设计真相.md`,
`.claude/rules/ui.md`, and the component governance tests.
`src/components/ui/*` is the formal project UI entry; tests and
`pnpm component:check` are the hard gate. Historical specs and plans under
`docs/superpowers/**` are background only unless a stable doc promotes the
same rule.

Do not delete, archive, or shrink Registry / Playbook until a later approved retirement proof explicitly authorizes it and confirms equal-or-stronger AI discoverability and machine governance.
