# Full Project Health Audit

## 0. Executive Summary

## 1. Audit Scope and Baseline

Base commit, remote freshness proof, worktree state, run posture, adjudicated-decisions record read.

## 2. Current Quality Verdict

## 3. Verified Healthy Foundations

What this run positively confirmed as sound — not only problems.

## 4. Critical-Chain Walkthrough Results

One subsection per chain (happy path + failure paths), each ending in pass / findings / blocked.

## 5. P0 / P1 Findings

## 6. Findings by Lane

One subsection per lane (00–07). Include binary-asset checks under the content lane.

## 7. Adjudication Compliance

- Implementations violating rulings that are due or delivered (normal findings, cross-referenced here)
- Conflicts with prior rulings (new evidence challenging a ruling — owner decides, not findings)
- Rulings whose preset review condition was met
- Confirmed defects under an explicit owner deferral (ledger only — not findings)
- Ruled work items in an approved plan, not yet delivered (plan progress — not findings)

## 8. Adversarial Verification Log

Single-source findings: refutation attempted, result, survived or rejected.

## 9. Rejected Candidates

Candidate findings that failed evidence gates or verification, with the rejection reason.

## 10. Reconciliation Results

Lane claims checked against git / filesystem / command output; discrepancies found.

## 11. Gate Credibility

Package scripts vs CI workflows vs release manifests vs what actually ran.

## 12. Environment / Credential / Audit-Process Issues

## 13. Delete-First / Simplify-First Repair Plan

## 14. Recommended Repair Sequence

## 15. Proof Boundary

Which checks ran, which did not, which conclusions require deployment or credentials, which need owner confirmation. Six proof grades kept distinct. For scoped runs: executed units vs lanes explicitly not covered. Closing counters: findings / rejected candidates / blocked / not-run / failed.

### Coverage map (fixed format)

| Unit | Kind | Owning lane | Critical chain | Coverage mode | Evidence | Exclusion / blocker |
| --- | --- | --- | --- | --- | --- | --- |

Coverage mode enum: fully checked | sampled | static-only | not checked | blocked | excluded. Rules: `sampled` states the sampling rule and the samples; `static-only` states the missing runtime proof; `blocked` states the unblock condition; `excluded` cites the requester's declared scope; any production unit absent from this table counts as `not checked`.

## 16. Process Retro

## Appendix A: Evidence Log

## Appendix B: Full Findings JSON
