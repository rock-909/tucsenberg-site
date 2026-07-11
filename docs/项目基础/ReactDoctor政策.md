# React Doctor Policy

The calibrated cleanup target is `0 error / 0 warning / 0 total`.
The command uses `npx --loglevel=error react-doctor@latest` so Codex and Claude skills follow the
current React Doctor release.

## Target

The blocking gate target is `0 error`. The full-report cleanup target is
`0 error / 0 warning / 0 total` for the current `react-doctor@latest` result.
Future React Doctor releases can add new rules; those are new cleanup work, not
a regression in this baseline.

## Rules

- `error` blocks CI.
- `warning` must be fixed, removed from scope as generated/tool code, or covered
  by a narrow file/rule exception with proof.
- `react:doctor` and `react:doctor:report` use `npx --loglevel=error react-doctor@latest`; do not
  add `react-doctor` back as a permanent devDependency.
- `doctor.config.json` may suppress only narrow file/rule combinations.
- Do not add broad `ignore.rules` or whole-directory `ignore.files` entries for convenience.
- Generated artifacts such as `storybook-static/**` are not project source and
  must not count toward source-quality totals.
- `.claude/skills/**` and `.codex/skills/**` are tool-owned bundles. Do not
  treat bundled third-party/runtime scripts inside those directories as project
  source.
- public-surface `knip/exports` and `knip/types` overrides require owner/API-surface review.
- JSON-LD `dangerouslySetInnerHTML` is allowed only in the centralized
  `JsonLdScript` wrapper when it renders native
  `<script type="application/ld+json">` and the serializer escapes unsafe `<`
  characters as `\u003c`.
- The cookie banner keeps `div role="dialog"` because it is a fixed,
  non-modal bottom banner with `aria-modal="false"` and height coordination via
  `--cookie-banner-height`; native `<dialog open>` changes browser layout and
  modal semantics.
- Turnstile effect callbacks are allowed only in
  `src/components/security/turnstile.tsx` for external-widget availability
  states: development bypass success and missing-site-key failure.
- Every exact file override in `doctor.config.json` must point to a live path.
  `tests/architecture/config-exact-paths-exist.test.ts` enforces this boundary.
- Dependency warnings are resolved by removing unused direct dependencies unless
  a package is a real script/bin entry such as `@lhci/cli` for
  `pnpm website:lighthouse`.

## Buckets

| Bucket | Meaning |
| --- | --- |
| `blocking-error` | Must fix before merge. |
| `confirmed-real` | Real production risk or quality debt; fix it. |
| `generated-or-tooling` | Generated output or tool-owned bundle; exclude narrowly. |
| `project-exception` | Documented repo-specific exception with file/rule scope. |
| `removable` | No active entry or proof; remove the direct dependency/export. |

## Do not

1. Do not migrate APIs mechanically to improve a score.
2. Do not rewrite tests just to reduce warning count.
3. Do not delete exports without proving they are not a public authoring/API surface.
4. Do not treat JSON-LD `dangerouslySetInnerHTML` as normal XSS when the serializer escapes unsafe characters.
5. Do not permanently delete generated output when cleanup is needed; move it
   to Trash first.
