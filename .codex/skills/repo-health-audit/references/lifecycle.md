# Full-Repo Audit Lifecycle

## 0. Scope lock

Clarify whether the user wants:

- read-only audit only
- audit plus repair planning
- repair wave implementation
- methodology/framework improvement

If the run is read-only, do not modify business code, configuration, dependencies, workflows, or content.

## 1. Preflight

Answer these before any lane starts:

1. target base branch and commit
2. local HEAD
3. worktree state
4. whether dirty work is included
5. allowed report/evidence write paths
6. forbidden business-code paths
7. commands that will run
8. commands that may be blocked by credentials, scripts, or environment
9. package/config readiness
10. business-code diff status against the target base

Stop if the base is unclear, package/config is incomplete, or forbidden dirty business-code diff exists.

## 2. Runtime truth

Create an explicit proof map:

| Surface | Can prove | Cannot prove |
| --- | --- | --- |
| static code | current implementation and config | deployed behavior |
| local build | build/prerender/compiler behavior | Cloudflare/Vercel runtime |
| local server | browser-visible local behavior | edge-specific integrations |
| preview URL | deployed preview behavior | production traffic/SEO state |
| production URL | current public behavior | source cause without repo evidence |
| dashboard | external service state | anything without credential access |

Runtime proof should enter early enough that UI, SEO, security, and CSP lanes can use it.

## 3. Lane execution

Each lane owns:

- its lane report
- its evidence directory
- its screenshots or generated reports directory

Each lane must not:

- edit business code
- edit other lane outputs
- decide the final repo verdict
- promote blocked or weak claims to P0/P1

## 4. Finding normalization

Normalize every lane finding to the contract in `evidence-contract.md`. Deduplicate by root cause, not by symptom. If two lanes find the same root cause, keep source traceability with `source_finding_ids`.

## 5. Final synthesis

Final report must be owner-readable:

1. executive summary
2. current quality verdict
3. P0/P1 list
4. project issues
5. environment issues
6. credential issues
7. audit-process issues
8. quality map
9. delete-first / simplify-first repair order
10. what could not be proved
11. process retro

## 6. Repair handoff

Do not put repairs in the audit PR by default. Create a separate repair wave with:

- finding IDs included
- explicit non-goals
- acceptance criteria
- regression guard per finding
- verification commands
- rollback/stop line

Use `assets/templates/repair-wave.md` for the handoff.

## 7. Retro

Record:

- which lanes found high-signal issues
- which commands produced decisive evidence
- which commands produced noise or side effects
- which prompts referenced stale paths
- which skills helped or hurt
- which blocked checks need owner credentials next time
