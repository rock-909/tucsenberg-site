# Evidence Contract

## Evidence levels

| Level | Meaning |
| --- | --- |
| Confirmed by execution | Verified by a command, test, build, page visit, API call, screenshot, generated report, or live runtime proof from this run |
| Confirmed by static evidence | Verified by current code, config, content, or checked-in artifact reading from this run |
| Strong hypothesis | Strong current evidence exists, but one decisive proof is missing |
| Weak signal | Suspicious pattern only; needs follow-up before it can drive priority |
| Blocked | Credential, environment, permission, missing script, or missing external data prevents confirmation |

## Severity

| Severity | Meaning |
| --- | --- |
| P0 | Build/deploy is blocked, critical buyer action is broken, clear exploitable security risk, or data integrity is actively at risk |
| P1 | Must fix before public launch or broad rollout; high trust, SEO, conversion, security, or maintenance risk |
| P2 | Schedule cleanup; medium maintainability, UX, proof-quality, coupling, or performance cost |
| P3 | Small improvement, documentation cleanup, cosmetic issue, or optional optimization |

Project anchors for tucsenberg-site — calibration cases, not a mechanical mapping:

- **P0**: no inquiry can be submitted at all; the UI reports success but no channel stored the lead; a directly exploitable security hole; production build or deploy fully broken; data loss, leakage, overwrite, or duplicate writes actively occurring with major data-integrity impact (a rare duplicate Airtable record is P1/P2, not P0).
- **P1**: product specs conflict with public structured data; one delivery channel silently failing while success is reported; production rate limiting failing open when its store is down; a test protecting launch-critical behavior that no CI or release gate runs **and** no equivalent gate covers (an unwired ordinary P2 test is not auto-promoted); a buyer-flow-referenced public PDF with wrong or unusable core content (an unreferenced legacy PDF or a metadata/compression nit is lower); deployed behavior clearly diverging from local proof.
- **P2**: a duplicated truth source that is currently consistent but drift-prone; a third-party timeout making inquiries visibly slow; a small business change requiring edits across many layers; dead code, unused dependencies, or needless compat layers; tests coupled to internal structure.
- **P3**: local naming, small non-business duplication, compressible assets, doc wording.

Severity is decided by the unprotected behavior risk, never by surface pattern-match against an anchor.

## Enums

Use exact values:

```text
severity: P0 | P1 | P2 | P3
confidence: high | medium | low
evidence_level: Confirmed by execution | Confirmed by static evidence | Strong hypothesis | Weak signal | Blocked
domain: baseline | architecture | security | performance | seo | ui | accessibility | tests | ai-smell | dead-code | conversion | process | robustness | observability | content | i18n | data-integrity | dependencies | gates
evidence.type: file | command | runtime | screenshot | report | external
linus_gate: Keep | Simplify | Delete | Needs proof | n/a
command.result: passed | failed | blocked | not-run
command.classification: required | optional | diagnostic | credential-blocked | environment-blocked | script-unavailable | policy-blocked
root_cause_class (optional): duplicate-truth | wrong-boundary | hidden-coupling | false-success | missing-failure-contract | fake-green-gate | dead-compatibility | unnecessary-abstraction | provider-leakage | runtime-drift | generated-source-confusion | owner-workflow-gap | missing-observability | unproven-claim
```

`root_cause_class` is optional per finding. Use it to merge findings by root cause across lanes and to track which defect classes recur across runs; do not force a class when none fits. When several fit, pick the one **closest to where the defect originates**.

One-line definitions:

- `duplicate-truth` — one authoritative fact or rule has multiple independent owners
- `wrong-boundary` — logic lives on the wrong side of a module/server/client/layer boundary
- `hidden-coupling` — modules depend on each other through paths not visible at the interface
- `false-success` — failure is converted into a success signal (empty ID accepted, partial failure reported as done)
- `missing-failure-contract` — no defined behavior for timeout, outage, cancellation, or partial failure
- `fake-green-gate` — a check exists but cannot actually fail, or no gate runs it
- `dead-compatibility` — retired paths, compat layers, or unused code still steering or cluttering live code
- `unnecessary-abstraction` — indirection with no second implementation, no real duplication removed
- `provider-leakage` — third-party semantics crossing the business boundary and raising swap cost
- `runtime-drift` — build-time, deploy-time, and runtime behavior or config diverge
- `generated-source-confusion` — generated artifacts edited or treated as author entry points
- `owner-workflow-gap` — the non-technical owner cannot observe, operate, or recover a business outcome
- `missing-observability` — the system cannot tell what happened when it matters
- `unproven-claim` — a stated guarantee (doc, contract, proof pointer) is not backed by evidence; **for process/proof findings only, never as a business-code root cause**

## Required finding shape

```json
[
  {
    "id": "FPH-001",
    "source_finding_ids": ["FPH-L01-001"],
    "title": "Short finding title",
    "severity": "P1",
    "domain": "architecture",
    "source_lane": "01-architecture-coupling",
    "confidence": "high",
    "evidence_level": "Confirmed by static evidence",
    "evidence": [
      {
        "type": "file",
        "reference": "exact file path, command, URL, or artifact path",
        "summary": "what this proves"
      }
    ],
    "impact": "owner-readable business impact",
    "root_cause": "why this exists",
    "root_cause_class": "duplicate-truth",
    "recommended_fix": "delete-first or simplify-first repair direction",
    "verification_needed": "how to prove the fix later",
    "linus_gate": "Simplify",
    "verification": {
      "status": "survived-adversarial-review",
      "refutation_attempt": "what was tried to disprove this",
      "result": "why the finding survived"
    }
  }
]
```

`root_cause_class` is optional; `verification` is required on every final finding (see "Verification block"). No other fields are allowed.

## Promotion rules

- P0/P1 require fresh evidence from the current run.
- P0/P1 require `Confirmed by execution` or `Confirmed by static evidence`.
- P0/P1 cannot have `confidence: low`.
- Old reports may be cited as clues only.
- A finding reported by only one lane must survive an adversarial refutation pass before entering the final report — **regardless of severity**. Maintainability and code-quality findings are mostly P2; severity sets priority, never exemption from refutation.
- Every finding in the final findings JSON carries a verification block. `multi-lane-corroborated` requires at least two distinct source finding IDs from **different** lanes — two IDs from the same lane do not corroborate. `not-required` is for working/candidate records only and is never valid in final findings.
- Finding objects allow exactly the required fields plus `root_cause_class` and `verification`; unknown fields are rejected (typo guard — a misspelled optional field must fail loudly, not silently vanish).
- Adjudicated items split five ways: re-challenging a ruling goes to "conflicts with prior rulings" (owner decides); an implementation violating a ruling that is due or delivered is a normal defect and enters findings; a ruling whose preset review condition is met goes to owner review; a confirmed defect the owner explicitly deferred goes to the adjudication ledger and proof boundary, not findings; a ruled work item in an approved execution plan not yet delivered is plan progress, not a defect finding. Ruling-violation findings must quote the ruling verbatim with location and rule out the last two cases.
- `Blocked` never appears as `evidence_level` in the final findings JSON; blocked items belong to the evidence manifest and proof boundary.
- Every candidate disposition (rejected / plan-progress / owner-deferred / blocked) is recorded in the final report with its reason and evidence; rejecting a candidate requires recorded counter-evidence, not a bare assertion.
- `policy-blocked` classifies commands not run because the run's write policy forbids their side effects — distinct from missing scripts or credentials.
- Do not conflate proof grades: request sent, handler returned success, mock called, real service accepted, real record/email exists, and owner received it are six different grades.
- `Blocked` must state what is missing and how to unblock it.
- If evidence conflicts, prefer live runtime behavior, then captured network traffic, actively served assets, process config, persisted state, generated artifacts, checked-in source, and comments/dead code last.

## Verification block (required in final findings)

Every finding entering the final findings JSON carries one:

```json
"verification": {
  "status": "survived-adversarial-review",
  "refutation_attempt": "what was tried to disprove this",
  "result": "why the finding survived"
}
```

`status` enum: `survived-adversarial-review` | `multi-lane-corroborated` | `not-required`.

- Single-source (one distinct source finding ID): must be `survived-adversarial-review` with both refutation fields filled.
- `multi-lane-corroborated`: at least two distinct source IDs from different lanes.
- `not-required`: working/candidate records only — never valid in the final findings JSON.

## Linus Gate

Use this as a repair-shape label, not as evidence:

- `Keep`: preserve the design; fix a narrow defect.
- `Simplify`: reduce branching, indirection, mock layers, or duplicate ownership.
- `Delete`: remove dead code, fake coverage, placeholder content, or unused abstraction.
- `Needs proof`: do not fix yet; first collect decisive evidence.
- `n/a`: no repair decision needed.
