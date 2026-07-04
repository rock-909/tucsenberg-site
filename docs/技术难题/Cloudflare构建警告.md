# Cloudflare Warning Baseline

This baseline records warnings emitted by generated OpenNext/Wrangler artifacts. These are not source-code findings by themselves.

## Known warnings

- `duplicate-case` in `.open-next/server-functions/default/handler.mjs`
- `direct-eval` in generated handler code
- `equals-negative-zero` in generated bundle code

## Policy

- If the warning appears only inside `.open-next/**`, classify it as a generated-bundle warning.
- Do not claim it is fixed by source edits unless a source change demonstrably removes it from a fresh `pnpm website:build:cf` and `pnpm exec wrangler deploy --dry-run --env preview`.
- New warning categories must be added here with date, command, and owner note.
