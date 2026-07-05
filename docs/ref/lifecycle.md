# Lifecycle

This starter has two lifecycle contexts:

1. The source repository is a template factory.
2. A derived project is a concrete website.

Do not make derived projects carry starter-only proof after handoff.

## `starter-only`

Use `starter-only` for checks, scripts, docs, and fixtures that prove this source
repository can still generate clean projects.

Examples:

- profile materialization
- profile matrix tests
- optional/demo surface exclusion checks
- generated compat sync checks
- starter docs truth checks
- showcase-full demo/reference proof
- file-set ownership and path skip rules

These checks stay in this source repository. A derived project should not keep
them as long-term CI unless it deliberately remains a template factory.

## `derive-once`

Use `derive-once` for handoff checks that run when a new website is generated.

Examples:

- package name, README, brand, domain, and env examples are replaced
- starter-only docs or proof commands are removed, hidden, or clearly marked
- optional demo routes and fixtures are absent unless the selected profile owns
  them
- generated message compat files match physical authoring packs
- remaining scripts are relevant to the derived website

These checks prove the new project did not inherit the wrong starter scaffolding.
They are not normal long-term CI for the derived website.

## `site-long-term`

Use `site-long-term` for checks that should remain useful after the website has
real content, real routes, and normal project-specific changes.

Examples:

- type-check
- lint
- unit and integration tests
- build
- current website content checks
- i18n checks when the derived website remains multilingual
- form, API, and security checks when the derived website keeps the lead pipeline
- deployment build checks for the selected hosting target

These checks belong to the concrete website, not to the starter factory.

## Root tooling lifecycle

| Path | Lifecycle | Notes |
| --- | --- | --- |
| `conductor.json` | `starter-only` | Source-repo collaboration orchestration; skipped from generated websites. |
| `conductor-setup.sh` | `starter-only` | Source-repo setup helper; skipped from generated websites. |
| `.coderabbit.yaml` | `starter-only` | Source-repo review automation config; skipped from generated websites. |
| `skills-lock.json` | `starter-only` | Source-repo skill/tooling lock state; skipped from generated websites. |
| `.mcp.example.json` | `derive-once` | Safe example developer integration config; keep in generated output as a handoff example, then replace or remove if the concrete website does not use MCP tooling. |
| `semgrep.yml` | `site-long-term` | Security scan config paired with `.github/workflows/**`; keep when the derived website keeps the Semgrep CI job, or rewrite/remove both together. |
| `.github/**` | later decision | CI/release ownership still needs a separate handoff decision. |
| `AGENTS.md` | later decision | Cross-tool project instructions; keep until generated-site guidance is explicitly split. |
| `CLAUDE.md` | later decision | Agent guidance surface; keep until generated-site guidance is explicitly split. |

## Check lifecycle matrix

`*:check` commands are check-only. Commands that refresh generated artifacts
must be explicit write/generate commands, such as
`node scripts/starter-checks.js content-manifest` or
`tsx scripts/starter-profile/sync-message-compat.ts --write`.

| Check | Lifecycle | CI | `release:verify` | Git hook | Notes |
| --- | --- | --- | --- | --- | --- |
| `pnpm type-check` | `site-long-term` | yes | yes | pre-commit | Type and Next route typing proof. |
| `pnpm lint:check` | `site-long-term` | yes | yes | pre-commit | ESLint plus local disable-governance check. |
| `pnpm test` / targeted Vitest suites | mixed | yes | targeted | pre-commit related tests | CI owns full unit/integration coverage; release proof owns critical route and middleware slices. |
| `pnpm content:check` | `site-long-term` | yes | split freshness and readiness | pre-push partial | Includes `content-manifest --check`, slug checks, and `node scripts/starter-checks.js translations`. |
| `node scripts/starter-checks.js content-manifest --check` | `starter-only` and `site-long-term` | via `pnpm content:check` | yes | pre-push | Generated content manifest freshness without writing tracked files. |
| `node scripts/starter-checks.js translations` | `starter-only` and `site-long-term` | via `pnpm content:check` | yes | pre-commit conditional and pre-push | Message compat freshness is covered here; do not add a second compat checker. |
| `node scripts/starter-checks.js client-boundary` | `site-long-term` | yes | no | no | PR-facing client bundle boundary guard. |
| Component governance tests, scan, and Storybook build | `starter-only` and `site-long-term` | yes | no | no | CI runs governance tests, scanner, and Storybook build; `pnpm component:check` remains the local wrapper command that runs the same component proof chain. |
| `dependency-cruiser` | `site-long-term` | yes | no | pre-push | Intentional direct CLI: `pnpm exec dependency-cruiser src --config .dependency-cruiser.js -T err` is shared by CI and hooks to avoid growing the public `package.json` command surface. |
| React Doctor | `site-long-term` | yes | no | no | Runs through `react-doctor@latest`; latest-version drift is accepted and documented in `docs/proof/baselines/react-doctor-policy.md`. |
| Semgrep | `site-long-term` | yes | no | no | CI runs `semgrep scan --error --severity ERROR --config semgrep.yml src`; only clear must-fix rules should be `ERROR`. Missing local CLI is blocked, not passed. |
| `pnpm build` | `site-long-term` | yes | yes | pre-push | Next production build proof. |
| `pnpm website:build:cf` | selected deployment proof | yes | yes | no | Cloudflare/OpenNext build proof. |
| `pnpm exec wrangler deploy --dry-run --env preview` | selected deployment proof | non-PR only | yes | no | Cloudflare Workers Free gzip budget proof requires credentials or local release proof. |
| `pnpm build && pnpm website:lighthouse` | manual performance proof | no | no | no | Run only when a change makes a performance claim; keep it outside default CI and git hooks. |
| Deployed smoke and real lead canary | manual launch proof | no | listed only | no | Public launch still needs deployed GET smoke, real lead canary, and owner signoff. |

## Naming guidance

- Prefer `starter:*` names for source-repo factory proof.
- Prefer `derive:*` names for one-time generated-project handoff checks.
- Prefer `site:*` or existing `website:*` names for long-term website checks.
- Use `proof:*` only when the docs clearly state what lifecycle the proof covers.
