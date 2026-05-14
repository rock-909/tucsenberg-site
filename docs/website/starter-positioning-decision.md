# Starter Positioning Decision

## Current decision

The current repository remains a High-config showcase starter. It is not a blank minimal shell.

This means the starter keeps opinionated website structure, product/service examples, owner proof surfaces, Storybook, content readiness checks, Cloudflare/OpenNext proof, and governance tests. A derived client project should replace the example truth, not strip the foundation first.

## Option A: High-config showcase starter

Keep products, ops dashboard, Storybook, content readiness, Cloudflare/OpenNext proof, and governance tests as starter capabilities. Public launch readiness is handled by strict replacement checks and owner signoff.

Use this when the derived project wants a complete showcase website foundation with inquiry flow, proof surfaces, i18n, component governance, and Cloudflare deployment.

## Option B: Minimal core plus optional presets

Core would include only home/about/contact/legal, minimal messages, minimal tests, and optional presets for products, ops dashboard, Storybook, Cloudflare analytics, Stryker, and governance.

This option requires a separate migration plan. Do not delete products, ops, Storybook, or governance tests without that plan.

## Follow-up backlog if Option B is selected

1. Define `starter:strip-demo` behavior.
2. Split product catalog into an opt-in preset.
3. Split ops dashboard into an opt-in preset.
4. Split Storybook, governance, and mutation testing into opt-in lanes.
5. Split tests into `starter-contract`, `demo-site`, `governance`, and `deployed-canary`.
