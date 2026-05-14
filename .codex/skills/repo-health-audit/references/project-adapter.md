# Project Adapter Guide

The project adapter turns the generic audit method into a repo-specific runbook. Keep it in the repo being audited, not inside this global skill.

Recommended structure:

```text
docs/audits/<audit-name>/
  audit.config.json
  project-profile.md
  runbook.md
  runs/
```

## `audit.config.json`

Required top-level fields:

- `audit_name`
- `audit_root`
- `target_base`
- `run_posture`
- `business_code_globs`
- `allowed_write_globs`
- `forbidden_write_globs`
- `report_files`
- `lanes`
- `commands`
- `credential_blockers`
- `stop_lines`

Validate with:

```bash
python3 .codex/skills/repo-health-audit/scripts/validate_audit_config.py docs/audits/<audit-name>/audit.config.json
```

## `project-profile.md`

Include:

- product or business goal
- stack and runtime platforms
- public launch definition
- critical buyer/user flows
- external services and credentials
- source-of-truth files
- known proof boundaries

## `runbook.md`

Include:

- required reading order
- preflight commands
- runtime handoff process
- lane dispatch policy
- final report outputs
- validation commands
- stop-line handling
- repair-wave separation

## `runs/<run-id>/`

Each audit run should have its own immutable output folder. Do not overwrite old runs to make the latest run look cleaner.

Suggested files:

```text
runs/<run-id>/00-final-report.md
runs/<run-id>/01-quality-map.md
runs/<run-id>/02-findings.json
runs/<run-id>/03-evidence-log.md
runs/<run-id>/04-process-retro.md
runs/<run-id>/lanes/
runs/<run-id>/evidence/
```

## Adapter anti-patterns

- hard-coding stale paths without verifying they exist
- listing commands that are not in package scripts
- allowing audit workers to edit business code
- mixing audit reports and repair commits in one large PR
- treating dashboard claims as confirmed without credentials
- using old audit outputs as current proof
