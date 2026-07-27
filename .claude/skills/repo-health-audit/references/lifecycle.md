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
11. location and content of the owner's adjudicated decisions (ruled items must not resurface as findings)
12. coverage map: every production directory, API route, public page, external service, and public binary asset assigned to an owning lane or chain — nothing important is unowned before lanes start

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

## 2b. Critical-chain walkthroughs

Before broad lane scanning, walk each critical business chain end to end along the real data flow — happy path and failure paths. Chains cross lane boundaries on purpose; this is where audit depth goes. For tucsenberg-site the three mandatory chains (product discovery, buyer inquiry, release) are defined in SKILL.md. Chain findings enter the same findings pool and the same evidence contract.

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

## 3b. Reconciliation and adversarial verification

Before normalization:

- reconcile every lane's claims against git, the filesystem, and actual command output; a worker's "done / all green" is unverified until checked
- verify lane report files and every cited path actually exist
- route every single-source finding through an independent refutation pass; only survivors proceed
- check gate credibility: package scripts vs CI workflows vs release manifests, so "a test exists" is not mistaken for "a gate enforces it"
- close out the coverage map from preflight: every entry gets a final status — fully checked / sampled / static-only / not checked / blocked / excluded (with reason) — reported in the proof boundary, so "whole repo" is a proven claim, not a mood

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

Repair closure uses explicit states per finding: Resolved / Partially resolved / Not resolved / Cannot verify / Superseded by structural fix / Accepted owner deferral. Closing requires re-running the original reproduction (it must now fail to reproduce), not "the code was changed". A repair PR with green CI means READY_FOR_ACCEPTANCE only — it does not mean the finding is closed, the owner accepted it, or production is proven.

## 7. Retro

Record:

- which lanes found high-signal issues
- which commands produced decisive evidence
- which commands produced noise or side effects
- which prompts referenced stale paths
- which skills helped or hurt
- which blocked checks need owner credentials next time
