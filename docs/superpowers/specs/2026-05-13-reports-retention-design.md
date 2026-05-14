# Reports Retention Design

## Purpose

Keep generated local reports from growing forever without touching human-authored audit material.

The repository already writes local proof artifacts into `reports/**`, and that
directory is ignored by git. Some report families are timestamped, while the
active "current" report is usually stored as `*-latest.*` or a stable filename.
The retention rule should only manage old generated timestamped reports.

## Decision

Add a small standalone Node script:

```bash
node scripts/quality/retention-reports.mjs --dry-run --keep 5
node scripts/quality/retention-reports.mjs --keep 5
```

The script does not permanently delete files. When not in dry-run mode, it
moves old reports into a recoverable `reports/.trash/retention-<timestamp>/`
batch while preserving their relative paths.

The package script defaults to dry-run:

```bash
pnpm reports:retention
```

This makes the command safe for routine use and keeps actual cleanup explicit.

## In scope

- Add `scripts/quality/retention-reports.mjs`.
- Add `reports:retention` to `package.json`.
- Add Vitest coverage for dry-run, keep counts, latest-file protection, Trash-first execution, and owner-authored markdown protection.
- Update `docs/website/quality-proof.md` so derived projects know this is local generated-report cleanup, not audit document cleanup.

## Out of scope

- Do not move or delete files under `docs/audits/**`.
- Do not move or delete files under `docs/superpowers/**`.
- Do not make retention run automatically after every report generation.
- Do not stage generated files from `reports/**`.
- Do not change the report output paths of existing checks.

## Retention contract

- Only scan `reports/**`.
- Ignore `reports/.trash/**`.
- Always keep `*-latest.*`.
- Keep the newest N timestamped files per generated report family.
- Treat timestamped JSON/SARIF/TXT/LOG files as generated report candidates.
- Treat timestamped Markdown as generated only for known generated Markdown report families, currently `reports/architecture/legacy-marker-audit-*.md`.
- Never permanently delete; execution moves files into `reports/.trash/**`.
- Dry-run prints what would move and makes no filesystem changes.

## Acceptance criteria

- `node scripts/quality/retention-reports.mjs --dry-run --keep 5` exits 0.
- Old timestamped generated reports can be moved to `reports/.trash/**`.
- `*-latest.*` files remain in place.
- Owner-authored Markdown remains untouched.
- Docs explain the cleanup boundary clearly.
