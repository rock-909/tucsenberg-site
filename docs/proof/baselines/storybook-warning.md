# Storybook Warning Baseline

`pnpm component:check` proves component governance and Storybook buildability. It does not prove production bundle performance.

## Known warnings

- `unable to find package.json for @opennextjs/cloudflare`

## Policy

- Treat this as Storybook dependency metadata noise unless it reproduces in
  `pnpm build` or `pnpm website:build:cf`.
- `@opennextjs/cloudflare` is a real project dependency for the Cloudflare build
  path. Storybook's dependency scanner attempts to read the package metadata
  directly, but the package does not expose `package.json` through its package
  exports.
- New warning categories should be investigated or added here with a short reason.
- Production performance requires Lighthouse or bundle analyzer proof, not Storybook chunk size alone.
