---
paths:
  - "src/**/*.{ts,tsx}"
  - "tests/**/*.{ts,tsx}"
  - "**/*.{test,spec}.{ts,tsx}"
  - "*config.{js,ts,mjs,mts}"
  - "package.json"
  - "pnpm-lock.yaml"
  - "eslint.config.mjs"
  - "stryker.config.json"
---

# Code Quality Rules

Use this file for source shape, complexity, imports, constants, and lint
exception policy.

## Complexity thresholds

These are review thresholds, not mechanical rewrite targets.

| File type | max lines | max lines per function | complexity | max depth | max params |
| --- | ---: | ---: | ---: | ---: | ---: |
| Production | 500 | 120 | 15 | 3 | 3 |
| Config | 800 | 250 | 18 | - | - |
| Test | 800 | 700 | 20 | - | 8 |

If code crosses a threshold, first identify the real boundary:

- route orchestration
- data/model preparation
- presenter/formatting logic
- platform adapter
- security/input boundary
- reusable UI component

Do not split code only to satisfy a number. Prefer a clear exception over
helper piles, object-parameter bags, or generic constants.

## ESLint disables

Use the smallest possible scope and name the exact rule:

```typescript
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- validated by Zod above
const email = parsed.data.email!;
```

No broad file-level disables without a current, specific reason.

## Magic numbers

Named constants are for values with domain meaning:

- HTTP status codes
- timeouts and retry delays
- cache TTLs
- rate limits
- byte sizes
- token lengths
- business limits

Direct literals are fine for language and UI idioms such as array index `0`,
`slice(..., -1)`, `strokeWidth={2}`, opacity defaults, or small layout counts.

Do not introduce `ZERO`, `ONE`, or similar aliases unless the name carries real
domain meaning.

## React performance patterns

- Do not add `memo`, `useMemo`, or `useCallback` broadly as a default style.
- Use memoization only when there is a clear trigger: expensive children,
  high-frequency interaction, large lists, stable prop contracts, React
  Profiler evidence, or React Doctor findings tied to the changed code.
- Do not make components harder to read only to satisfy a generic performance
  warning. Prefer simple code unless there is measurable benefit.

## Dependency hygiene

- Treat unused dependency and unused export reports as leads, not deletion
  proof.
- Classify findings before removal: active runtime entry, generated/tooling
  entry, documented governance surface, false positive, or removable.
- Do not remove UI wrapper exports, governance scripts, or generated-surface
  helpers only because static analysis cannot see their entrypoint.
- Dependency removals must include the smallest proof that the current catalog
  site and related tooling still work.

## Hard gates

- TypeScript: zero errors. This gate covers production code only. `tsconfig.json`
  excludes `tests/**`, `**/*.test.*`, and `src/test/**`; test code is transpiled
  and executed by Vitest and is not independently type-checked. This is an
  owner-decided quality exemption (production code is the strict standard), not
  an oversight — do not wire test code into `tsc`.
- ESLint: zero warnings
- Build: no errors

Production code must not import `src/test/**`, `src/testing/**`, or
`src/constants/test-*`.

## Upgrade drift

- Do not copy old framework examples without checking the installed docs.
- When a package upgrade changes the public API shape, update the rule or proof
  doc that controls future use of that API in the same branch.
- Prefer deleting stale compatibility comments over adding new wrappers around
  obsolete behavior.
- If a warning is intentionally accepted, record the owner and proof boundary;
  do not let it become anonymous build noise.
