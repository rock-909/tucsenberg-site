# Cost & Runtime Model

Detailed cost / runtime expectations for `/ai-smell-audit`. Referenced from `SKILL.md` — main agent reads this when a user asks about cost or when recommending a run cadence.

## Baseline assumptions

- Codebase scale: ~150K LOC TypeScript + 55 MDX files (reference shape)
- Model: Claude Opus 4.7
- Effort: xhigh
- Run happens on a clean main branch (dirty tree adds provenance-tag overhead, immaterial)

## Per-mode table

| Mode   | Typical runtime | Typical cost | Consumes        | Lane agents    |
|--------|-----------------|--------------|-----------------|----------------|
| code   | 30–45 min       | $10–18       | 400k–600k tok   | Lane A + D     |
| proof  | 50–70 min       | $20–35       | 700k–1.0M tok   | + Lane B       |
| truth  | 50–75 min       | $20–40       | 700k–1.1M tok   | + Lane C       |
| full   | 80–120 min      | $35–60       | 1.1M–1.6M tok   | A + B + C + D  |

## Scaling factors

Multiplier applied to the base figures above.

- **LOC count**: linear under ~300K; super-linear above (parallel lane workers saturate context)
- **Baseline grade = Blocked**: +15% runtime (more cross-verification)
- **Dirty working tree >20 files**: +3% runtime (per-finding provenance tagging)
- **High findings >15**: +5–10 min (100% main-agent verification)
- **No `.claude/rules/ai-smells.md`**: Lane B falls back to generic S25-S30 — same cost, slightly lower precision
- **First-ever run in a repo**: +15% (no prior skill/cluster memory to reuse)

## Recommended cadence

| Mode   | Cadence                                    | Rationale                                 |
|--------|--------------------------------------------|-------------------------------------------|
| code   | Weekly during active development, post-PR  | Cheap enough to run often; catches drift early |
| proof  | Monthly                                    | Proof lane drift accumulates slowly       |
| truth  | Before every release                       | Docs-tree drift matters most near ship    |
| full   | Quarterly, or pre-fundraise/acquisition    | Expensive; only when you need everything  |

## What NOT to do

- Do not default `full` mode in CI. It's a decision-support audit, not a regression gate.
- Do not chain `code` → `proof` → `truth` back-to-back in one session; cache stales and findings dedupe poorly across split runs. Use `full` instead.
- Do not interpret low token / runtime as "nothing was found" — low counts might mean scope was too narrow or the baseline was Blocked. Always check the appendix's "scope + baseline" lines first.
