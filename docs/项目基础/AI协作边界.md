# AI

Codex and Claude can collaborate, but durable truth must live in files.

## Entry files

- Codex: `AGENTS.md`
- Claude: `CLAUDE.md`
- Local preference: `CLAUDE.local.md`

Both should point back to `docs/README.md`; do not maintain two competing encyclopedias.

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
- `src/lib/mdx-importers.generated.ts`

Refresh with:

```bash
node scripts/starter-checks.js content-manifest
node scripts/starter-checks.js content-manifest --check
```

## Workflow outputs

CWF/DWF workflow capability can stay. If generated workflow outputs are added
again, keep them out of current product docs and put them under the Superpowers
plan output tree, for example:

```text
docs/superpowers/plans/workflows/cwf/
```

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
