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

## Enums

Use exact values:

```text
severity: P0 | P1 | P2 | P3
confidence: high | medium | low
evidence_level: Confirmed by execution | Confirmed by static evidence | Strong hypothesis | Weak signal | Blocked
domain: baseline | architecture | security | performance | seo | ui | accessibility | tests | ai-smell | dead-code | conversion | process
evidence.type: file | command | runtime | screenshot | report | external
linus_gate: Keep | Simplify | Delete | Needs proof | n/a
command.result: passed | failed | blocked | not-run
command.classification: required | optional | diagnostic | credential-blocked | environment-blocked | script-unavailable
```

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
    "recommended_fix": "delete-first or simplify-first repair direction",
    "verification_needed": "how to prove the fix later",
    "linus_gate": "Simplify"
  }
]
```

## Promotion rules

- P0/P1 require fresh evidence from the current run.
- P0/P1 require `Confirmed by execution` or `Confirmed by static evidence`.
- P0/P1 cannot have `confidence: low`.
- Old reports may be cited as clues only.
- `Blocked` must state what is missing and how to unblock it.
- If evidence conflicts, prefer live runtime behavior, then captured network traffic, actively served assets, process config, persisted state, generated artifacts, checked-in source, and comments/dead code last.

## Linus Gate

Use this as a repair-shape label, not as evidence:

- `Keep`: preserve the design; fix a narrow defect.
- `Simplify`: reduce branching, indirection, mock layers, or duplicate ownership.
- `Delete`: remove dead code, fake coverage, placeholder content, or unused abstraction.
- `Needs proof`: do not fix yet; first collect decisive evidence.
- `n/a`: no repair decision needed.
