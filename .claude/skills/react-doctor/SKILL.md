---
name: react-doctor
description: Use before completing React or Next.js code changes, before committing UI/form/client-component work, or when improving code quality. Runs the project-pinned React Doctor gate used by CI.
---

# React Doctor for Claude Code

Use this skill after React/Next.js changes and before saying the work is done.

## Required command

Run the project-pinned error gate:

```bash
pnpm react:doctor
```

This is blocking. React Doctor errors must be fixed before completion.

## Warning review

This repo no longer has a separate React Doctor governance or raw-governance CI
layer. Warning classification is human backlog/reference work, not a CI gate.

For cleanup, audit, or triage work, generate the manual JSON report:

```bash
pnpm react:doctor:report
```

Use the report to support human review. Do not present warning classification
as an automated merge blocker unless the project contract changes again.

## Project rules

- Errors are CI blockers.
- Warnings are review signals unless the task explicitly targets warning cleanup.
- Do not mechanically fix warnings that could change buyer-facing behavior, i18n, deployment/runtime behavior, or design tokens.
- For dead-code findings, verify real production, script, build, and runtime references before removing anything.
- Prefer small, behavior-preserving fixes over score-chasing.
- If a finding appears false-positive, explain why and use the narrowest suppression only after proving the cleanup path is worse.
