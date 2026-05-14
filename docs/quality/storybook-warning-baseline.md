# Storybook Warning Baseline

`pnpm component:check` proves component governance and Storybook buildability. It does not prove production bundle performance.

## Known warnings

- `unable to find package.json for @opennextjs/cloudflare`
- Vite sourcemap warnings for client component files
- `"use client" was ignored` from Vite bundling
- Storybook iframe chunk larger than 500 kB

## Policy

- Treat these as Storybook proof noise unless they reproduce in `pnpm build`.
- New warning categories should be investigated or added here with a short reason.
- Production performance requires Lighthouse or bundle analyzer proof, not Storybook chunk size alone.
