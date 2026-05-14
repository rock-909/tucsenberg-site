# React Doctor Policy

React Doctor is an error-level gate in this starter.

## Gate policy

- `error` blocks CI.
- `warning` is backlog, not merge-blocking by default.
- The calibrated gate target is `0 error`; warning-level dead-code output is a
  review queue unless a finding has file-level runtime proof.
- `react-doctor.config.json` may suppress only narrow file/rule combinations
  that are backed by this policy, the exception registry, or the classified
  historical warning review.
- The only directory-level patterns in the current config are
  `.claude/skills/**` and `.codex/skills/**`, and they are scoped to Knip-backed
  dead-code rules through `ignore.overrides`. These are tool-owned AI skill
  bundles, not website runtime source.
- Do not add broad `ignore.rules` or whole-directory `ignore.files` entries for
  convenience. Do not suppress non-Knip diagnostics for skill bundles without a
  separate tool-ownership review.
- CI does not run a separate classified or raw governance layer. Warning
  classification is human backlog/reference work, not an extra CI gate.
- `pnpm react:doctor:report` remains available when a human reviewer needs a
  JSON snapshot for manual warning backlog review.

## Buckets

| Bucket | Meaning | Merge impact |
| --- | --- | --- |
| `blocking-error` | React Doctor error. | Blocks. |
| `confirmed-real` | Real production risk or quality debt with clear proof. | Fix in repair waves. |
| `needs-manual-proof` | Rule may be right, but hidden runtime or order dependencies need proof. | Do not batch-fix. |
| `project-exception` | Tool rule is generally good, but this repo has a documented exception. | Do not fix unless the exception changes. |
| `test-fixture-noise` | Test or support fixture warning. | Do not block release. |
| `low-value-style` | Style or micro-optimization. | Cleanup only after higher-value work. |

## Calibrated warning definition

The long-term cleanup direction is still to reduce warning noise, but the
project rule after calibration is stricter than a raw count and safer than
blind cleanup:

```text
blocking-error: 0
confirmed-real: 0
unresolved: 0
```

Every raw warning must have exactly one actionable disposition:

| Disposition | Meaning | Owner |
| --- | --- | --- |
| `fix` | The warning is real and must be repaired. | `engineering` |
| `delete-after-proof` | The code is unnecessary, and runtime/build/script proof supports removal. | `engineering` |
| `exempt-after-proof` | The warning is a documented exception or test/support fixture signal. | `quality-governance` or `test-governance` |
| `temporarily-retain` | The warning needs a dedicated proof lane or is low-value style cleanup. | `proof-lane` or `quality-governance` |

At the current calibrated baseline, React Doctor reports zero errors and a
dead-code warning backlog. The old raw baseline is no longer tracked or
enforced as a separate CI gate. If a future React Doctor report shows new
meaningful diagnostics, repair, remove after proof, or reclassify them with
owner and reason.

## Current known shape

The initial integrated scan had 516 warnings and 0 errors.

After the production repair waves, sanitizer proof lane, config calibration,
governance slimming, unused-export cleanup, and public-surface review, the
native gate has 0 errors and no native warnings:

```text
total warnings: 0
affected files: 0
score: 100 / 100
types: 0
exports: 0
files: 0
duplicates: 0
```

Dead-code findings remain deletion candidates only after proof, not automatic
deletion instructions. File-level dead-code signals have been triaged into
narrow `knip/files` overrides when the files are external tool entrypoints or
test alias assets. Skill bundles under
`.claude/skills/**` and `.codex/skills/**` are excluded from Knip-backed dead
code diagnostics because they are agent/tool capability packs. Duplicate-export
signals are either removed when they are only module-local implementation
details, or narrowly exempted when they preserve separate business semantics.
Unused exports and types require owner/API-surface review before removal. The
current public-surface `knip/exports` and `knip/types` overrides are limited to
starter authoring contracts, facade contracts, component variant composition
surfaces, protected contact/SEO compatibility APIs, cookie-consent helpers, and
test authoring types. Do not expand these overrides without adding a concrete
reason in this policy or the baseline notes.

Most warning volume is not production behavior:

- test and fixture files are the largest source
- many production findings are style shorthand suggestions
- scripts mostly trigger performance micro-optimization rules
- several warnings are known project exceptions
- static loading skeleton keys, decorative grid crosshair keys, pure content
  render helpers, and user-entered email line keys are not treated as immediate
  production bugs
- lazy client island activation state warnings are documented project
  exceptions when tests prove that state drives the render branch
- quality script warnings are handled in a separate proof lane before any
  rewrite; string/document scans and ordered Cloudflare smoke probes are
  documented exceptions, not batch performance cleanup targets
- sanitizer warnings were fixed after a dedicated security proof lane covered
  nested tags, missing closing tags, mixed casing, and attacker-controlled
  payloads

## Warning gate decision

Raw warning-level CI blocking is still not used, because warning handling is
owned by focused proof lanes plus human warning backlog review. The effective
merge target is React Doctor 0 error, with warning cleanup handled separately.

Do not change the CI gate to `--fail-on warning` unless the team intentionally
decides that the current warning backlog should be eliminated or explicitly
suppressed as a canonical warning-level baseline.

## Rules of repair

1. Do not treat warning count as bug count.
2. Do not delete code from dead-code tools without runtime and script proof.
3. Do not rewrite tests only to improve a score.
4. Do not migrate `forwardRef` or `useContext` mechanically.
5. Do not treat JSON-LD `dangerouslySetInnerHTML` as a normal XSS bug when the JSON serializer is escaping unsafe characters.
6. Keep React Doctor warning cleanup out of release blocking until the warning signal is stable.
