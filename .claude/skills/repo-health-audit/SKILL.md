---
name: repo-health-audit
description: Use for evidence-first full repository health audits, launch-readiness audits, audit framework design, lane-based review orchestration, findings JSON normalization, and audit-to-repair planning. This is the authoritative whole-repo audit scheme for tucsenberg-site (整库审查 / 整库权威审查 / 全库代码审查 / 上线就绪审查). Trigger when the user asks for whole-project audit, full project health audit, repo-wide quality review, launch readiness review, multi-lane audit, or reusable audit methodology.
---

# Repo Health Audit

## Purpose

Run a full-project audit as an evidence pipeline, not as a loose code review. The method is generic; the project truth for tucsenberg-site is embedded in this skill (see "Tucsenberg project truth") so no separate adapter files are needed for that repo. For other repos, use the adapter pattern in `references/project-adapter.md`.

Audit quality scales with the executing agent; this skill guarantees the floor — claims without qualifying evidence cannot enter the report — not the ceiling.

Use this as the audit orchestrator skill. It may call other skills; it does not replace them.

## When not to use

- For one PR/diff review only: prefer `intent-review`.
- For one bug or failing route: use `superpowers:systematic-debugging` first.
- For cleanup after a fix: use `simplify`.
- For AI-code smell only: use `ai-smell-audit` directly unless the user wants a full repo health audit.

## Hard rules (non-negotiable)

1. **Evidence grading is the admission ticket, not a report section.** Every finding carries severity, evidence level, and confidence before it is written down. P0/P1 require fresh `Confirmed by execution` or `Confirmed by static evidence` from this run, never `low` confidence. `Blocked` is a to-do, not a problem: state what is missing and how to unblock.
2. **Adjudicated decisions are not re-litigated.** Read the owner's past rulings before auditing (for tucsenberg: `docs/技术难题/整库审查2026-07/审查报告.md` 第四节 and `执行计划.md` 裁决记录). Distinguish five cases: (a) re-challenging a ruling itself — goes to a separate "conflicts with prior rulings" section for the owner, never into findings; (b) the implementation violating a ruling that is already due or delivered — a normal current defect, enters findings; (c) a ruling's preset review condition being met — goes to owner review, not labeled a code defect; (d) a confirmed defect the owner has explicitly deferred — goes to the adjudication ledger and proof boundary, never re-packaged as a new finding; (e) a ruled work item carried by an approved execution plan and not yet delivered — that is plan progress, tracked in the adjudication-compliance section, not a defect finding. Any finding claiming a ruling violation must quote the ruling verbatim with its location AND confirm it is not case (d) or (e). Old audit reports are clues only, never evidence for this run.
3. **Single-source findings get adversarial verification.** A finding reported by only one lane must be independently re-examined with the explicit goal of refuting it before it can enter the final report. Findings independently reported by two or more lanes may merge by root cause directly.
4. **Lane claims are reconciled against reality.** A subagent's "done / all green / confirmed" must be checked against git, the filesystem, and actual command output. Verify that lane report files exist and that every cited path exists. (This project has seen two fabricated completion reports from background subagents.)
5. **Binary assets get their own checks.** Public PDFs, images, and OG cards are invisible to code-reading lanes. Inspect them directly (pdftotext, pdfinfo, image metadata). A prior audit missed unlabeled PDFs with near-zero extractable text until an external second review caught it.
6. **Audits are read-only by default.** Lanes never fix business code. Repairs go to a separate repair wave with its own commits. Commands whose writes are confined to gitignored build output (e.g. `pnpm type-check` writing `.next/types`) run in place and are declared as such — never copy the repository into evidence directories to fake isolation.
7. **Stop lines stop the run.** Unclear base commit or audit scope, dirty worktree, business-code diff in a read-only audit, a planned command whose script does not exist, or a command that would destroy evidence: stop and report to the owner instead of working around it. A P0/P1 candidate lacking fresh evidence is NOT a stop line — demote that one finding (downgrade, mark for follow-up, or reject) and keep the run going.
8. **The audit subject is declared by the requester, not invented by the executor.** Standard postures: `current-worktree@SHA` | `origin/main@SHA` | an explicit SHA. If HEAD diverges from the target base and the requester declared no subject, that is a stop line — ask, do not pick one yourself; findings can flip between true and false depending on which you audit. If the remote is unreachable, pin the exact SHA, mark remote freshness `Blocked`, and scope every conclusion to that SHA; if the run's stated purpose requires latest main, stop instead.

## Skill routing

Use the smallest useful set of companion skills:

1. `superpowers:using-superpowers` before workflow decisions.
2. `superpowers:writing-plans` before creating or changing an audit framework.
3. `superpowers:subagent-driven-development` only when the user explicitly wants parallel/subagent execution.
4. `superpowers:systematic-debugging` when audit work exposes a concrete bug, runtime 500, CI failure, or unexpected behavior.
5. `intent-review` for the pre-merge judgement on a repair PR — requirement coverage, scope, fit, and residual risk.
6. `ai-smell-audit` for the tests / AI smell / dead-code lane.
7. `simplify` after repair implementation and before commit.
8. `superpowers:verification-before-completion` before saying the audit, fix, or validation is complete.

## Core workflow

1. **Preflight first.** Confirm base branch, exact commit, local HEAD, worktree state, package readiness, allowed writes, forbidden writes, planned commands, likely blockers, and the adjudicated-decisions record. If business-code diff exists in a read-only audit, stop.
2. **Runtime truth early.** Establish what can be proved from local build, local server, preview URL, production URL, worker tail, screenshots, and external dashboards. Do not let static code reading overrule live runtime behavior without proof.
3. **Critical-chain walkthroughs.** Before broad lane scanning, walk each critical business chain end to end along the real data flow — happy path and failure paths. This is where depth goes; lanes provide breadth. Chain findings feed the same findings pool.
4. **Lane audit.** Use lane workers or local lane passes with strict ownership. Lanes diagnose and collect evidence; they do not fix code and do not decide the final repo verdict. Dispatch lanes blind to each other so agreement between lanes carries signal.
5. **Gate credibility check.** A test existing is not proof CI runs it. Reconcile package scripts, CI workflows, and release manifests against what the lanes assumed was enforced.
6. **Adversarial verification.** Apply hard rule 3 to every single-source finding. Reconcile every lane's claims per hard rule 4.
7. **Normalize evidence.** Every finding needs severity, evidence level, confidence, exact evidence, impact, root cause, recommended fix, verification needed, and Linus Gate.
8. **Consolidate.** Deduplicate by root cause, downgrade weak claims, separate project issues from environment, credential, and audit-process issues.
9. **Repair planning.** Produce delete-first / simplify-first order. Do not mix audit output and business-code fixes unless the user asks for a repair wave.
10. **Retro.** Record which commands, lanes, skills, and evidence sources produced signal or noise, then fold the lessons back into this skill.

The final report must close with a **proof boundary**: which checks ran, which did not, which conclusions can only be verified after deployment, and which still need owner confirmation. It includes the closed-out coverage map (from preflight): every production directory, API route, public page, external service, and public binary asset with its owning lane/chain and final status — fully checked / sampled / static-only / not checked / blocked / excluded with reason — so "whole repo" is a proven claim. A scoped (non-full) run must list its executed units and the lanes explicitly not covered, so partial coverage never reads as full coverage. Close with distinct counters: findings / rejected candidates / blocked / not-run / failed.

## Evidence gates

- P0/P1 findings require fresh evidence from the current run.
- P0/P1 evidence level must be `Confirmed by execution` or `Confirmed by static evidence`.
- P0/P1 cannot use `Strong hypothesis`, `Weak signal`, `Blocked`, or `low` confidence.
- Old reports are clues only. They cannot be decisive evidence for P0/P1.
- `Blocked` is not a confirmed problem. State the missing credential, environment, script, or external data.
- Scratch paths are not final evidence unless copied into the tracked audit artifact root.
- `Blocked` items never enter the final findings JSON; they live in the evidence manifest and the proof boundary.
- In a single-executor run every finding is single-source by definition: the executor must still perform a separate refutation pass and record it in the finding's verification block.
- When capturing command output through pipes (`tee`, `grep`), use `set -o pipefail` — otherwise a failing test can exit green and become fabricated evidence.
- Proof levels are distinct and must not be conflated: "browser sent the request" / "route handler returned success" / "mock was called" / "real service accepted the request" / "real record or email exists" / "owner actually received it" are six different grades of evidence.

For exact enums and JSON shape, read `references/evidence-contract.md`.

## Lane model

Eight lanes, together covering the fourteen review dimensions of a mature whole-repo audit:

| Lane | Owns (dimensions) |
| --- | --- |
| 00 Baseline / runtime truth | build, deploy, and runtime consistency |
| 01 Business correctness / data integrity | behavior contracts; lead-data integrity end to end |
| 02 Security / trust boundary | security, privacy, abuse protection |
| 03 Robustness / observability | failure isolation; operations and recovery |
| 04 Content / SEO / i18n / binary assets | content truth, SEO, structured data, i18n, PDFs/images/OG |
| 05 UI / performance / accessibility | performance and resource budgets; critical-flow completability |
| 06 Gates / tests credibility | test quality; gate and proof credibility |
| 07 Architecture / maintainability / dependencies | architecture and truth sources; maintainability; supply chain |

Chain walkthroughs are not lanes: a chain follows one data flow deeply across lane boundaries; a lane covers one domain broadly. Run both.

Read `references/lane-contracts.md` before dispatching workers or writing lane prompts.

## Tucsenberg project truth

Business: English-only B2B site for Tucsenberg flood barriers. The audit's top priority is not code beauty but: **product information is true, buyers can complete an inquiry, inquiries reliably reach the owner, security boundaries hold, and deployed behavior matches local proof.** The owner is non-technical; write impact in business language.

### Critical chains (walk all three, every run)

1. **Product discovery**: product truth source → catalog → product detail page → SEO metadata → JSON-LD → sitemap → CTA. Watch for: spec drift between page and JSON-LD, retired paths (zh, blog, starter) resurfacing, client-forgeable product identity.
2. **Buyer inquiry**: form → client state → Turnstile → API boundary → rate limit → validation → server-side product identity confirmation → lead pipeline → Resend + Airtable → user feedback → logs and recovery. Watch for: fake success (partial channel failure reported as success; a 2xx with an empty provider ID was once marked success), rate-limit store failing open, Turnstile failure leaving no contact path, duplicate submission.
3. **Release**: source → message/content generation → Next build → OpenNext build → Cloudflare Worker → headers/assets → preview/dry-run → post-deploy smoke → real-inquiry canary → owner confirmation. Watch for: local-only proof mistaken for deploy proof, guards that only grep for string presence.

A requester's explicit scope lawfully overrides "all three": chains excluded by scope are listed as not covered in the proof boundary, never silently omitted.

### Truth sources

- Brand facts: `src/config/single-site.ts`; SEO/crawl policy: `src/config/single-site-seo.ts`; product detail truth: `src/constants/tucsenberg-product-pages.ts`
- Behavior contracts: `docs/项目基础/行为合约.md`; proof levels: `docs/项目基础/验证等级.md`, `发布验证.md`, `上线验证.md`
- Messages: `messages/base/` + `messages/profiles/` are author entry; `messages/en/` is generated (`pnpm messages:sync`) — never an edit surface
- UI governance: `docs/design/设计真相.md`, `docs/design/组件使用手册.md`, `.claude/rules/ui.md`; `docs/superpowers/**` is process material, not runtime truth
- Next.js API questions: read `node_modules/next/dist/docs/`, never trust training memory

### Commands

Required baseline proof (a local `origin/main` SHA alone proves nothing about remote freshness): `git status --short --branch`, `git ls-remote origin refs/heads/main`, `git rev-parse HEAD origin/main`, `git merge-base HEAD origin/main`, `git diff --stat origin/main...HEAD`; then `pnpm type-check`, `pnpm lint:check`, `pnpm test`, `pnpm build`.
Optional by risk: `pnpm website:build:cf` (shares `.next` with `pnpm build` — **never run the two in parallel**), `pnpm website:check`, `pnpm knip:check`, `pnpm content:check`, `pnpm component:check`, `pnpm website:lighthouse`, `pnpm release:verify`, `pnpm exec wrangler deploy --dry-run --env preview`.

### Known proof boundaries

- Production-domain status is a per-run fact, never assumed: verify it each run from `docs/项目基础/上线验证.md`, runtime config, and a live check of the production URL. If production is unreachable or unverifiable, production smoke and real-canary claims are `Blocked`.
- Credential-gated: Cloudflare dashboard/tail, Resend, Airtable, Turnstile dashboards, Google Search Console/CrUX.
- Lighthouse is-crawlable fails on non-production builds by design (env-gated robots meta) — expected, not a finding.

### Prior audit assets

- 2026-07-13 authoritative report: `docs/技术难题/整库审查2026-07/审查报告.md` (with file:line evidence); execution plan: same dir `执行计划.md`. Owner rulings live in these two files — hard rule 2 applies.
- Working evidence and lane files go to the untracked `.context/audits/<run-id>/`; only the final report set is committed, to `docs/技术难题/整库审查<run-id>/`. Evidence cited by the final report must be copied out of `.context` into the tracked report dir. Never overwrite an old run. (The former "every new tracked doc must be registered in `文档清单.md`" requirement was retired 2026-07-26 along with the check that enforced it — do not reintroduce it here.)

## Reusable structure

Three-layer model:

```text
global skill: how to audit (this file + references)
project truth: what this repo is and how it runs (embedded above for tucsenberg; adapter files for other repos)
single audit run: what this run proved (.context/audits/<run-id>/ working, tracked final report per repo doc governance)
```

For non-tucsenberg repos, read `references/project-adapter.md` before creating adapter files.

## Validation helpers

Use the bundled scripts (in this skill's `scripts/` directory):

```bash
python3 <skill-dir>/scripts/validate_findings.py <path-to-findings.json>
python3 <skill-dir>/scripts/validate_audit_config.py <path-to-audit.config.json>
python3 <skill-dir>/scripts/skill_selfcheck.py
```

These are structural checks only. They do not replace manual evidence review. Run `skill_selfcheck.py` after every edit to this skill: it catches drift between docs, templates, validator enums, validator boundary behavior, and the `.codex` mirror copy.

## Templates

Copy templates from `assets/templates/` when creating a new audit kit:

- `audit.config.json`
- `lane-report.md`
- `final-report.md`
- `findings.json`
- `evidence-manifest.json`
- `repair-wave.md`

Do not copy templates blindly. Fill project-specific paths, command names, credential blockers, and write scopes from current repo evidence.
