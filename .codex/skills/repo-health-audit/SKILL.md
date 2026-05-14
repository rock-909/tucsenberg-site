---
name: repo-health-audit
description: Use for evidence-first full repository health audits, launch-readiness audits, audit framework design, lane-based review orchestration, findings JSON normalization, and audit-to-repair planning. Trigger when the user asks for whole-project audit, full project health audit, repo-wide quality review, launch readiness review, multi-lane audit, or reusable audit methodology.
---

# Repo Health Audit

## Purpose

Run a full-project audit as an evidence pipeline, not as a loose code review. The skill separates project-specific adapters from reusable audit method, enforces preflight before auditing, and prevents weak or blocked evidence from becoming high-severity findings.

Use this as the audit orchestrator skill. It may call other skills; it does not replace them.

## When not to use

- For one PR/diff review only: prefer `review-swarm`.
- For one bug or failing route: use `superpowers:systematic-debugging` first.
- For cleanup after a fix: use `simplify`.
- For AI-code smell only: use `ai-smell-audit` directly unless the user wants a full repo health audit.

## Skill routing

Use the smallest useful set of companion skills:

1. `superpowers:using-superpowers` before workflow decisions.
2. `superpowers:writing-plans` before creating or changing an audit framework.
3. `superpowers:subagent-driven-development` only when the user explicitly wants parallel/subagent execution.
4. `superpowers:systematic-debugging` when audit work exposes a concrete bug, runtime 500, CI failure, or unexpected behavior.
5. `review-swarm` for independent read-only review of a current diff or repair PR.
6. `ai-smell-audit` for the tests / AI smell / dead-code lane.
7. `simplify` after repair implementation and before commit.
8. `superpowers:verification-before-completion` before saying the audit, fix, or validation is complete.

## Core workflow

1. **Preflight first.** Confirm base branch, exact commit, local HEAD, worktree state, package readiness, allowed writes, forbidden writes, planned commands, and likely blockers. If business-code diff exists in a read-only audit, stop.
2. **Runtime truth early.** Establish what can be proved from local build, local server, preview URL, production URL, worker tail, screenshots, and external dashboards. Do not let static code reading overrule live runtime behavior without proof.
3. **Lane audit.** Use lane workers or local lane passes with strict ownership. Lanes diagnose and collect evidence; they do not fix code and do not decide the final repo verdict.
4. **Normalize evidence.** Every finding needs severity, evidence level, confidence, exact evidence, impact, root cause, recommended fix, verification needed, and Linus Gate.
5. **Consolidate.** Deduplicate by root cause, downgrade weak claims, separate project issues from environment, credential, and audit-process issues.
6. **Repair planning.** Produce delete-first / simplify-first order. Do not mix audit output and business-code fixes unless the user asks for a repair wave.
7. **Retro.** Record which commands, lanes, skills, and evidence sources produced signal or noise so the next audit improves.

## Evidence gates

- P0/P1 findings require fresh evidence from the current run.
- P0/P1 evidence level must be `Confirmed by execution` or `Confirmed by static evidence`.
- P0/P1 cannot use `Strong hypothesis`, `Weak signal`, `Blocked`, or `low` confidence.
- Old reports are clues only. They cannot be decisive evidence for P0/P1.
- `Blocked` is not a confirmed problem. State the missing credential, environment, script, or external data.
- Scratch paths are not final evidence unless copied into the tracked audit artifact root.

For exact enums and JSON shape, read `references/evidence-contract.md`.

## Reusable structure

Prefer this three-layer model:

```text
global skill: how to audit
project adapter: what this repo is and how it runs
single audit run: what this run proved
```

Project adapters should live in the target repo, for example:

```text
docs/audits/<audit-name>/audit.config.json
docs/audits/<audit-name>/project-profile.md
docs/audits/<audit-name>/runbook.md
docs/audits/<audit-name>/runs/<run-id>/
```

Read `references/project-adapter.md` before creating or updating adapter files.

## Lane model

Default lanes:

1. Baseline / runtime truth
2. Architecture / coupling
3. Security / trust boundary
4. UI / performance / accessibility
5. SEO / content / conversion
6. Tests / AI smell / dead code

Read `references/lane-contracts.md` before dispatching workers or writing lane prompts.

## Validation helpers

Use the bundled scripts when available:

```bash
python3 .codex/skills/repo-health-audit/scripts/validate_findings.py <path-to-findings.json>
python3 .codex/skills/repo-health-audit/scripts/validate_audit_config.py <path-to-audit.config.json>
```

These are structural checks only. They do not replace manual evidence review.

## Templates

Copy templates from `assets/templates/` when creating a new audit kit:

- `audit.config.json`
- `lane-report.md`
- `final-report.md`
- `findings.json`
- `evidence-manifest.json`
- `repair-wave.md`

Do not copy templates blindly. Fill project-specific paths, command names, credential blockers, and write scopes from current repo evidence.
