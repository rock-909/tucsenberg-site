# AI

Codex and Claude can collaborate, but durable truth must live in files.

## Entry files

- Codex: `AGENTS.md`
- Claude: `CLAUDE.md`
- Local preference: `CLAUDE.local.md`

Both should point back to `docs/README.md`; do not maintain two competing encyclopedias.

## Superpowers

`docs/superpowers/` is active workflow space, not product docs. Old plans/specs may contain stale profile or version facts.

## UI motion changes

Before adding or changing animation, transitions, page reveal, loading motion, or
`motion/react`, read:

```text
docs/ref/motion.md
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

CWF/DWF workflow capability can stay. Generated workflow outputs belong under:

```text
docs/superpowers/workflows/cwf/
```

Do not treat old workflow outputs as starter content.

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
