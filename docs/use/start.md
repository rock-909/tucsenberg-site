# Start

Use this when creating a new project from the starter.

## Default

Default profile: `company-site`.

It gives a normal company website: Home, About, Products overview, Blog, Resources, Contact, Privacy, Terms.

It excludes market detail pages, capabilities/how-it-works/custom-project-support, heavy catalog demo, optional fixtures, and showcase-full demo packs.

## Commands

Dry-run first:

```bash
pnpm profile:dry-run -- --profile company-site
```

Create a new output directory:

```bash
pnpm profile:materialize -- --profile company-site --out /path/to/new-project
```

Optional profiles:

```bash
pnpm profile:dry-run -- --profile b2b-lead
pnpm profile:dry-run -- --profile catalog
pnpm profile:dry-run -- --profile content-marketing
pnpm profile:dry-run -- --profile showcase-full
```

## Safety rules

- Pass `--dry-run` or `--out`; no implicit write.
- Do not output into this repo.
- Do not output into a non-empty directory.
- Source repo files are not deleted or modified.
- Generated/local directories such as `.git`, `.next`, `node_modules`, `reports`, `coverage`, `storybook-static`, `.context`, `.superpowers`, `.codex`, `.omx` are skipped.
- Source-repo collaboration and review tooling such as `conductor.json`, `conductor-setup.sh`, `.coderabbit.yaml`, and `skills-lock.json` is skipped from materialized output.
- Generated-site tooling examples such as `.mcp.example.json` stay as
  `derive-once` handoff examples.
- `semgrep.yml` stays with `.github/workflows/**` when the generated website
  keeps the Semgrep CI proof; rewrite or remove both together if the concrete
  project chooses another security scan.

## Expected company-site output

Includes:

```text
/
/about
/products
/blog
/blog/[slug]
/resources
/contact
/privacy
/terms
messages/base
messages/profiles/minimal
messages/profiles/b2b-lead
messages/profiles/company-site
```

Excludes:

```text
src/app/[locale]/products/[market]/**
src/app/[locale]/capabilities/**
src/app/[locale]/how-it-works/**
src/app/[locale]/custom-project-support/**
profile-fixtures/catalog/**
profile-fixtures/content-marketing/**
profile-fixtures/showcase-full/**
public/profile-fixtures/**
messages/profiles/catalog/**
messages/profiles/content-marketing/**
messages/profiles/showcase-full/**
messages/examples/ui-demo/**
```

## Derived project handoff

After materialization, treat the output as a concrete website, not another copy
of the starter factory.

### Keep

- current website `src/app/**`, components, config, content, messages, and public
  assets
- `type-check`, `lint`, `test`, and `build`
- content and i18n checks that still match the derived website
- form, API, security, and deployment checks for features the website keeps

### Remove or hide

- profile matrix tests
- materialization checks
- showcase-full demo proof
- starter-only release proof
- optional surface fixtures not owned by the selected profile
- starter-only workflow outputs
- docs that teach maintainers how to keep this repository as a starter factory

### Downgrade or rewrite

- starter replacement docs should become current-project maintenance docs
- starter proof commands should become website proof commands
- profile language should disappear unless the derived project intentionally
  keeps multiple profiles

## Next

After materialization:

1. Replace real company content: `replace.md`.
2. Check profile boundary: `../ref/profiles.md`.
3. Run launch proof: `../proof/launch.md`.

Heavy integration tests can materialize profiles and type-check outputs. Full materialized `showcase-full` type-check remains deferred; it is not the default adopter path.
