# AI

Codex and Claude can collaborate, but durable truth must live in files.

## Entry files

- Codex: `AGENTS.md`
- Claude: `CLAUDE.md`
- Local preference: `CLAUDE.local.md`

Both should point back to `docs/README.md`; do not maintain two competing encyclopedias.

## Code review

Branches are reviewed by an **independent Codex session before push**, not by a
cloud PR bot. CodeRabbit is switched off, not removed: on this repo it reviewed
after the PR already existed, and its findings arrived too late to be worth the
round trip. `.coderabbit.yaml` stays in the repo with `auto_review.enabled` and
`chat.auto_reply` set to `false`, because the tuning is real work.

Re-enabling is not those two lines. Two problems were open when it was parked,
and both are recorded at the top of `.coderabbit.yaml`: incremental review burns
quota on every push to an open PR, and a quota-exhausted run still reports the
check as passing. Switching it back on without settling those brings back a
green tick that means nothing.

Two properties make the current arrangement work, and both must be preserved:

- **Independent context.** The reviewer does not share the authoring session. A
  reviewer that already believes the change is correct proves nothing.
- **Refutation, not confirmation.** The prompt asks it to prove the change wrong.
  "Looks good" is not an outcome the prompt should make easy to reach.

Findings are triaged against the code, not accepted on authority. A reviewer can
be wrong; rejecting a finding is fine, but the reason belongs in the report.

A review that did not run must never be reported as a review that passed.

Mechanics live in `.claude/commands/pr.md` Phase 4. Do not restate them here.
`/review-fix` is the path for handling cloud review threads; it is parked
alongside `.coderabbit.yaml` and only applies if CodeRabbit is switched back on.

## Superpowers

Upstream `obra/superpowers` currently writes specs and implementation plans to:

- `docs/superpowers/specs/**`
- `docs/superpowers/plans/**`

Older upstream history used `docs/plans/**`. This project follows the current
upstream default, not the older path.

Local `.superpowers/**` state is not a repo document path and must not be
committed.

This derived site still keeps some inherited execution material under `plans/`.
Treat those files as run records, not product docs. They may contain stale
starter/profile facts.

## UI motion changes

Before adding or changing animation, transitions, page reveal, loading motion, or
`motion/react`, read:

```text
docs/design/动效治理.md
```

Motion in this starter is governance-first. It must clarify state, hierarchy, or
navigation path. Do not add animation only to make a page feel premium.

Agent rules:

- prefer CSS and existing state attributes before JavaScript orchestration;
- do not turn static marketing sections into Client Components only for motion;
- keep hero and above-the-fold claim content visible by default;
- preserve `prefers-reduced-motion` behavior;
- do not add page-level reveal, long durations, or new motion dependencies
  without separate proof.

## Generated content

Do not hand-edit:

- `src/lib/content-manifest.generated.ts`

Refresh with:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-manifest --check
```

## Workflow outputs

The project-local CWF/DWF and Ponytail slash commands are retired; the owner
confirmed on 2026-07-28 that they are no longer used. If any generated workflow
output is added again, keep it out of current product docs and put it under the
Superpowers plan output tree.

Do not treat old workflow outputs or old plans as Tucsenberg product truth.

## Do not commit

- `.codex/auth.json`
- `.codex/history.jsonl`
- `.codex/log/`
- `.codex/*.sqlite*`
- `.codex/shell_snapshots/`
- `.superpowers/`
- `.omx/`
- `.context/`
- `.claude/settings.local.json`
- real `.mcp.json`
