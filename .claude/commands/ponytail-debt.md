---
name: ponytail-debt
description: Harvest ponytail comments into a simplification debt ledger
user-invocable: true
---

Harvest every `ponytail:` comment in this repository into a debt ledger so
deferrals do not rot into "later means never".

Search the repo for comment markers such as `// ponytail:` and `# ponytail:`,
skipping dependency, git, and build-output directories.

One row per marker, grouped by file:

`<file>:<line> - <what was simplified>. ceiling: <limit>. upgrade: <trigger>.`

Tag any marker that names no upgrade path or trigger as `no-trigger`.

End with the count of markers and how many lack a trigger. If none:
`No ponytail: debt. Clean ledger.`
