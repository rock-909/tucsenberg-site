# Docs Inventory

This file records why each tracked `docs/` file exists. It is an existence
review, not the current product truth. Start current work from `../README.md`.

## Lifecycle labels

| Label | Meaning |
| --- | --- |
| `current-entry` | Navigation entry for current maintainers. |
| `current-reference` | Maintained rule, boundary, decision, or design truth. |
| `current-proof` | Current proof runbook, contract, baseline, or release evidence. |
| `inherited-starter-reference` | Useful only when maintaining inherited starter/profile behavior. |
| `historical-proof` | Preserved evidence from an earlier starter stage; not current launch proof. |
| `method-workflow` | Reusable working method; not current product truth by itself. |
| `candidate-backlog` | Possible future work; not an approved integration or active plan. |
| `review-needed` | Keep for now, but decide later whether to link, merge, archive, or move. |

## Directory review

| Directory | Status | Exists because | Current handling |
| --- | --- | --- | --- |
| `docs/` | `current-entry` plus one orphan method doc | Owns the maintainer doc set. | Keep `README.md` as the entry; review the root Chinese performance method doc for a better home. |
| `docs/use/` | `current-entry`, `current-reference`, `inherited-starter-reference`, `method-workflow` | Explains current site maintenance and inherited starter workflows. | Keep current maintenance docs prominent; keep inherited workflow docs clearly bounded. |
| `docs/ref/` | `current-entry`, `current-reference`, `candidate-backlog` | Owns mechanisms, decisions, contracts, and maintainer rules. | Keep canonical docs linked from `README.md`; weak reference files need either index links or later merge decisions. |
| `docs/ref/decisions/` | `current-reference` | Stores accepted ADRs and decision records. | Keep accepted ADRs, but mark historical proof snippets when they mention retired routes. |
| `docs/proof/` | `current-entry`, `current-proof`, `historical-proof` | Owns proof levels, launch/release checks, baselines, and archived evidence. | Current launch truth is `launch.md` and `release.md`; archive proof cannot replace them. |
| `docs/proof/baselines/` | `current-proof`, `method-workflow`, `review-needed` | Keeps warning and governance baselines used during review. | Keep, but link or merge zero-reference baselines if they stay useful. |
| `docs/proof/performance/` | `historical-proof` | Preserves starter-era Lighthouse and performance audit evidence. | Every markdown file here must say it is historical starter proof. |
| `docs/design/` | `current-entry`, `current-reference`, `method-workflow` | Owns current design truth and Impeccable design references. | Keep design truth current; treat workflow material as method, not product truth. |
| `docs/design/impeccable/` | `current-reference`, `method-workflow` | Keeps the design system workbench and component governance references. | Keep while UI governance and Storybook/component checks still depend on this layer. |

## File review

| File | Label | Exists because | Next handling |
| --- | --- | --- | --- |
| `docs/README.md` | `current-entry` | Main doc entry for the Tucsenberg site. | Keep canonical. |
| `docs/性能实验优化方法论.md` | `method-workflow`, `review-needed` | Records the performance experiment method in Chinese. | Keep for now; later link from `proof/performance/README.md` or move under a clearer proof/method path. |
| `docs/use/README.md` | `current-entry` | Explains current maintenance docs and inherited starter docs. | Keep. |
| `docs/use/ai.md` | `current-reference` | Sets durable truth boundaries for Codex/Claude collaboration and generated workflow output. | Keep. |
| `docs/use/brand.md` | `current-reference` | Explains brand/domain/contact replacement for the current site. | Keep. |
| `docs/use/content.md` | `current-reference` | Explains content, SEO, messages, and content checks. | Keep. |
| `docs/use/deploy.md` | `current-reference` | Explains Cloudflare, env, forms, and deployment configuration. | Keep. |
| `docs/use/replace.md` | `inherited-starter-reference` | Keeps the starter replacement order and replacement surfaces. | Keep bounded as inherited, not current business truth. |
| `docs/use/start.md` | `inherited-starter-reference` | Explains materialize/profile startup behavior inherited from the starter. | Keep bounded as inherited. |
| `docs/use/project-workflow.md` | `method-workflow`, `inherited-starter-reference` | Preserves the old project website production workflow. | Keep as historical workflow; do not use as current product truth. |
| `docs/use/website-production-workflow.md` | `method-workflow`, `inherited-starter-reference` | Preserves the long-form website production workflow. | Keep as historical workflow; do not use as current product truth. |
| `docs/use/website-production-workflow.excalidraw` | `method-workflow`, `review-needed` | Diagram artifact paired with the workflow doc. | Keep with the workflow unless that workflow is later archived or replaced. |
| `docs/ref/README.md` | `current-entry` | Main entry for mechanisms, contracts, and decisions. | Keep. |
| `docs/ref/docs-inventory.md` | `current-reference` | Records this docs existence review and lifecycle labels. | Keep updated when docs are added, moved, merged, or archived. |
| `docs/ref/project.md` | `current-reference` | Defines the current Tucsenberg project boundary. | Keep canonical. |
| `docs/ref/config.md` | `current-reference` | Defines config ownership and runtime facade boundaries. | Keep. |
| `docs/ref/contracts.md` | `current-reference`, `current-proof` | Lists user-visible behavior contracts and their proof owners. | Keep. |
| `docs/ref/lifecycle.md` | `current-reference` | Defines source-starter, site-long-term, and inherited tool lifecycles. | Keep. |
| `docs/ref/maintainers.md` | `current-reference` | Owns maintainer truth rules, guardrails, clusters, and docs ownership. | Keep. |
| `docs/ref/messages.md` | `current-reference` | Defines message pack ownership and generated compatibility files. | Keep. |
| `docs/ref/motion.md` | `current-reference` | Defines motion governance and proof boundaries. | Keep. |
| `docs/ref/profiles.md` | `current-reference`, `inherited-starter-reference` | Explains profiles, fixtures, and demo boundaries. | Keep. |
| `docs/ref/surfaces.md` | `current-reference` | Defines replacement surfaces and non-authoring surfaces. | Keep. |
| `docs/ref/tech.md` | `current-reference` | Defines stack, Cloudflare/OpenNext, cache, CSP, and dependency policy. | Keep. |
| `docs/ref/ui-components.md` | `current-reference` | Defines UI component governance and approved wrapper boundaries. | Keep. |
| `docs/ref/ui-component-index.md` | `current-reference` | Indexes UI wrappers, surfaces, and agent selection rules. | Keep. |
| `docs/ref/architecture-diagram.svg` | `current-reference` | Visual architecture reference. | Keep. |
| `docs/ref/architecture-tree.md` | `current-reference`, `review-needed` | Text fallback for the architecture diagram. | Keep for now; later link from `ref/README.md` or merge into `project.md` / `tech.md`. |
| `docs/ref/integrations.md` | `candidate-backlog`, `review-needed` | Holds possible future integrations and rejected/paused candidates. | Keep as backlog if it remains useful; otherwise merge into a decision/backlog note later. |
| `docs/ref/decisions/content-as-code-cms.md` | `current-reference` | Accepted ADR for content-as-code and CMS boundary. | Keep; locale examples are future-capable content modeling, not a current `/zh` route promise. |
| `docs/ref/decisions/radix-contact-form-pilot.md` | `current-reference`, `historical-proof`, `review-needed` | Accepted Radix contact pilot result with old build proof. | Keep; later add a short historical proof boundary around the retired `/zh/contact` evidence. |
| `docs/ref/decisions/ui-foundation.md` | `current-reference` | Accepted UI foundation ADR. | Keep canonical for Radix/Tailwind split. |
| `docs/proof/README.md` | `current-entry` | Entry for proof boundaries. | Keep. |
| `docs/proof/launch.md` | `current-proof` | Current launch proof for Tucsenberg. | Keep canonical; `/zh` appears only as a current 404 requirement. |
| `docs/proof/release.md` | `current-proof` | Current release-proof command order. | Keep canonical. |
| `docs/proof/levels.md` | `current-proof` | Defines proof levels and when to run them. | Keep. |
| `docs/proof/dry-run.md` | `current-proof`, `inherited-starter-reference` | Proves inherited `company-site` materialized output boundaries. | Keep while starter/profile tooling remains. |
| `docs/proof/next16-activity-state-audit.md` | `historical-proof`, `current-reference` | Preserves a Next.js 16 behavior audit that still informs rules. | Keep unless the rule is fully absorbed elsewhere. |
| `docs/proof/baselines/client-boundary-budget.json` | `current-proof` | Machine-readable client boundary budget. | Keep. |
| `docs/proof/baselines/cloudflare-warning.md` | `current-proof`, `review-needed` | Baseline for expected Cloudflare warning behavior. | Keep; later link from `proof/README.md` if still active. |
| `docs/proof/baselines/react-doctor-policy.md` | `current-proof` | Policy for React Doctor findings. | Keep. |
| `docs/proof/baselines/react-doctor.md` | `current-proof`, `review-needed` | Captures the React Doctor baseline. | Keep; later merge or link with `react-doctor-policy.md` if duplicated. |
| `docs/proof/baselines/route-mode.md` | `current-proof`, `review-needed` | Baseline for route rendering mode expectations. | Keep; later link from proof index if still active. |
| `docs/proof/baselines/storybook-warning.md` | `current-proof`, `review-needed` | Baseline for Storybook warning behavior. | Keep while Storybook/component governance remains. |
| `docs/proof/baselines/testing/icon-mock-best-practices.md` | `method-workflow`, `review-needed` | Testing guidance for icon mocks. | Keep until tests confirm it is obsolete or it is merged into testing rules. |
| `docs/proof/baselines/testing/mock-config-standard.md` | `method-workflow`, `review-needed` | Testing guidance for mock configuration. | Keep until tests confirm it is obsolete or it is merged into testing rules. |
| `docs/proof/performance/README.md` | `historical-proof` | Entry for archived starter performance proof. | Keep archive boundary. |
| `docs/proof/performance/full-performance-audit.md` | `historical-proof` | Starter-era full performance audit. | Keep as archive only. |
| `docs/proof/performance/lcp-first-paint-motion-boundary.md` | `historical-proof` | Starter-era LCP/motion proof. | Keep as archive only. |
| `docs/proof/performance/lighthouse-budget-governance.md` | `historical-proof` | Starter-era Lighthouse budget governance proof. | Keep as archive only. |
| `docs/proof/performance/lighthouse-prefetch-policy.md` | `historical-proof` | Starter-era prefetch policy proof. | Keep as archive only. |
| `docs/proof/performance/lighthouse-product-detail-payload.md` | `historical-proof` | Starter-era product detail payload proof. | Keep as archive only. |
| `docs/proof/performance/lighthouse-shared-payload.md` | `historical-proof` | Starter-era shared payload proof. | Keep as archive only. |
| `docs/proof/performance/lighthouse-yellow-debt-attribution.md` | `historical-proof` | Starter-era Lighthouse yellow-debt attribution. | Keep as archive only. |
| `docs/proof/performance/lighthouse-yellow-debt-baseline.md` | `historical-proof` | Starter-era Lighthouse yellow-debt baseline. | Keep as archive only. |
| `docs/proof/performance/lighthouse-yellow-debt-wave-1-closeout.md` | `historical-proof` | Starter-era Lighthouse wave 1 closeout. | Keep as archive only. |
| `docs/proof/performance/lighthouse-yellow-debt-wave-2-baseline.md` | `historical-proof` | Starter-era Lighthouse wave 2 baseline. | Keep as archive only. |
| `docs/proof/performance/lighthouse-yellow-debt-wave-2-closeout.md` | `historical-proof` | Starter-era Lighthouse wave 2 closeout. | Keep as archive only. |
| `docs/proof/performance/lighthouse-zero-yellow-attribution.md` | `historical-proof` | Starter-era zero-yellow attribution. | Keep as archive only. |
| `docs/proof/performance/performance-governance-candidate-audit.md` | `historical-proof` | Starter-era performance governance candidate audit. | Keep as archive only. |
| `docs/proof/performance/seo-public-surface-performance-headroom.md` | `historical-proof` | Starter-era SEO public surface performance headroom proof. | Keep as archive only. |
| `docs/design/README.md` | `current-entry` | Entry for design docs. | Keep. |
| `docs/design/truth.md` | `current-reference` | Current design truth and inherited design boundaries. | Keep canonical. |
| `docs/design/impeccable/README.md` | `current-entry`, `method-workflow` | Entry for the Impeccable design workbench. | Keep. |
| `docs/design/impeccable/design-workflow.md` | `method-workflow` | Reusable DWF design workflow. | Keep as method, not current product truth. |
| `docs/design/impeccable/system/COLOR-SYSTEM.md` | `current-reference` | Color system reference. | Keep. |
| `docs/design/impeccable/system/COMPONENT-GOVERNANCE.md` | `current-reference` | Component governance reference. | Keep. |
| `docs/design/impeccable/system/DESIGN-TOKENS.md` | `current-reference` | Design token notes. | Keep. |
| `docs/design/impeccable/system/GRID-SYSTEM.md` | `current-reference` | Grid system reference. | Keep. |
| `docs/design/impeccable/system/MOTION-PRINCIPLES.md` | `current-reference` | Motion design principles. | Keep with `docs/ref/motion.md`. |
| `docs/design/impeccable/system/PAGE-PATTERNS.md` | `current-reference`, `review-needed` | Page pattern reference with broad mandates. | Keep, but later verify its mandates still match the current Tucsenberg site. |
| `docs/design/impeccable/system/SECTION-REDESIGN-CHECKLIST.md` | `current-reference` | Checklist for section redesign. | Keep. |
| `docs/design/impeccable/system/STORYBOOK-COVERAGE-MAP.md` | `current-reference` | Maps Storybook coverage expectations. | Keep while component governance and Storybook examples remain. |

## Follow-up buckets

1. Link-or-merge weak reference docs:
   `architecture-tree.md`, `integrations.md`, baseline warning docs, and testing
   mock guidance.
2. Add historical boundary notes where current ADRs preserve old proof snippets,
   especially `decisions/radix-contact-form-pilot.md`.
3. Decide whether `docs/性能实验优化方法论.md` should move under
   `docs/proof/performance/` or stay as a root-level method note.
4. Review design workflow and page-pattern mandates after the current site
   design direction stabilizes.
