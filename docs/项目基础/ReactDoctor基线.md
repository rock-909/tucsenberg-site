# React Doctor Baseline

React Doctor runs through `npx --loglevel=error react-doctor@latest` so local Codex / Claude
skills and package scripts follow the current analyzer release.

Repo config file: `doctor.config.json`.

## Current gate

The blocking gate fails on `error` diagnostics and keeps the changed-scope gate enabled.

CI runs:

```bash
pnpm react:doctor
```

Current wrapper:

```bash
npx --loglevel=error -y react-doctor@latest --verbose --scope changed --blocking error
```

Manual JSON review:

```bash
pnpm react:doctor:report
```

Current wrapper:

```bash
npx --loglevel=error -y react-doctor@latest --json --no-score --blocking none
```

## Policy

- `error` blocks CI.
- The blocking gate target is `0 error`.
- The full-report cleanup target is `0 error / 0 warning / 0 total`.
- The current baseline is React Doctor `0.5.8` as resolved by
  `react-doctor@latest` on 2026-06-26.
- Generated output such as `storybook-static/**` is excluded from project
  source-quality totals.
- Skill bundles under `.claude/skills/**` and `.codex/skills/**` are
  tool-owned and may use narrow rule exceptions for bundled non-project code.
- Do not delete dead-code findings without runtime/script proof.
- The JSON-LD script wrapper is a documented exception for
  `dangerouslySetInnerHTML` because Next.js recommends native JSON-LD script
  tags and the project serializer escapes unsafe `<` characters.
- The cookie banner and Turnstile exceptions are single-file rule exceptions
  documented in `docs/项目基础/ReactDoctor政策.md`.

Detailed policy: `docs/项目基础/ReactDoctor政策.md`.
Historical starter exception lists were not retained in this derived checkout.
