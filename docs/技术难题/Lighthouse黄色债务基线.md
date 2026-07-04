# Lighthouse Yellow Debt Baseline

Historical starter proof. This file is not current Tucsenberg launch proof; see
`../项目基础/上线验证.md`, `../项目基础/发布验证.md`, `../项目基础/验证等级.md`, and `../README.md` for the current
boundary.

**Date:** 2026-05-23
**Branch:** perf/lighthouse-yellow-debt-wave-1
**Phase:** Wave 1A — read-only attribution only (Task 3 not executed)

## Verification status

| Scope | Status |
| --- | --- |
| Wave 1A baseline capture | ✅ `pnpm build` + `CI_DAILY=true pnpm website:lighthouse` (2026-05-23) |
| Task 3 repair | ❌ Not executed — stopped at Task 2 pending Codex review |
| Full Wave 1 final verification | ❌ Not yet — requires Task 3+ repairs plus `pnpm lint:check`, `pnpm type-check`, `pnpm test`, `pnpm build`, `CI_DAILY=true pnpm website:lighthouse` |

## Metrics methodology

- **Transfer size** (this document): Lighthouse `total-byte-weight`,
  `resource-summary` JS/CSS/font/image columns — network payload bytes.
- **Not transfer size:** Lighthouse `script-treemap-data` `resourceBytes` /
  `unusedBytes` — uncompressed source estimates. Do not quote treemap bytes as
  network savings.
- Example chunk `0u50s2q5tiahi.js` on product detail: **transferSize ~69450
  bytes (~69 KB)**, **resourceSize ~298758 bytes (~299 KB)** per Lighthouse
  `network-requests`.

## Commands

- `pnpm build` — exit 0
- `CI_DAILY=true pnpm website:lighthouse` — exit 0 (14 warning-level `total-byte-weight` findings only)

## Summary

Best run per URL (highest performance score; tie-break lower LCP). All metrics from `.lighthouseci/lhr-*.json` extracted 2026-05-23.

| URL | Perf | A11y | BP | SEO | LCP ms | TBT ms | Total bytes | JS bytes | CSS bytes | Font bytes | Image bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en` | 84 | 100 | 100 | 100 | 4383 | 91 | 543446 | 367834 | 106083 | 44686 | 0 |
| `/zh` | 84 | 100 | 100 | 100 | 4368 | 85 | 544795 | 367834 | 106083 | 44686 | 0 |
| `/en/about` | 87 | 100 | 100 | 100 | 3919 | 100 | 545721 | 369941 | 106083 | 44686 | 0 |
| `/zh/about` | 87 | 100 | 100 | 100 | 3917 | 102 | 547055 | 369941 | 106083 | 44686 | 0 |
| `/en/contact` | 88 | 100 | 100 | 100 | 3760 | 104 | 586318 | 399629 | 106083 | 44686 | 0 |
| `/zh/contact` | 88 | 100 | 100 | 100 | 3821 | 101 | 588417 | 399629 | 106083 | 44686 | 0 |
| `/en/products` | 85 | 96 | 100 | 100 | 4243 | 98 | 571899 | 375253 | 106083 | 44686 | 0 |
| `/zh/products` | 87 | 96 | 100 | 100 | 3924 | 103 | 574274 | 375253 | 106083 | 44686 | 0 |
| `/en/blog` | 87 | 96 | 100 | 100 | 3935 | 101 | 582294 | 362037 | 106083 | 44686 | 0 |
| `/zh/blog` | 87 | 96 | 100 | 100 | 3894 | 84 | 584927 | 362037 | 106083 | 44686 | 0 |
| `/en/products/north-america` | 85 | 100 | 100 | 100 | 4313 | 65 | 676099 | 415065 | 106083 | 69088 | 2907 |
| `/zh/products/north-america` | 85 | 100 | 100 | 100 | 4237 | 107 | 679651 | 415065 | 106083 | 69088 | 2907 |
| `/en/blog/prepare-before-launch` | 86 | 96 | 100 | 100 | 4010 | 123 | 557222 | 362037 | 106083 | 44686 | 0 |
| `/zh/blog/prepare-before-launch` | 87 | 96 | 100 | 100 | 3923 | 109 | 559359 | 362037 | 106083 | 44686 | 0 |

## Findings

### Total-byte-weight warnings (all 14 URLs)

Every audited URL exceeds the Lighthouse warn threshold of **490 KB** (`lighthouserc.js` `maxNumericValue: 490000`). Overages range from **~54 KB** (home) to **~190 KB** (product detail). These are **warning-level only**; the Lighthouse CI run exits 0.

| Route class | URL example | Total bytes | Over warn by |
| --- | --- | ---: | ---: |
| Home | `/en` | 543446 | 53446 |
| About | `/en/about` | 545721 | 55721 |
| Blog listing | `/en/blog` | 582294 | 92294 |
| Blog article | `/en/blog/prepare-before-launch` | 557222 | 67222 |
| Product listing | `/en/products` | 571899 | 81899 |
| Contact | `/en/contact` | 586318 | 96318 |
| **Product detail** | `/en/products/north-america` | **676099** | **186099** |

### Product detail pages — heaviest transfer, LCP near gate

Product detail is the **heaviest route class** by total transfer size. LCP is in the same ~4.2–4.4 s band as home, with both routes approaching the Phase 1 hard gate (4500 ms):

| Metric | `/en/products/north-america` | `/zh/products/north-america` | vs `/en` home |
| --- | ---: | ---: | ---: |
| LCP | 4313 ms | 4237 ms | −70 ms / −131 ms |
| Total bytes | 676099 | 679651 | +132653 / +134856 |
| JS bytes | 415065 | 415065 | +47231 |
| CSS bytes | 106083 | 106083 | 0 (shared) |
| Font bytes | 69088 | 69088 | +24402 |
| Image bytes | 2907 | 2907 | +2907 |

LCP headroom to the 4500 ms hard gate: product detail **187 ms** (`/en`), home **117 ms** (`/en`). Product detail is the priority for **byte-weight reduction** (+186 KB over warn threshold); LCP follow-up should target shared JS/CSS rather than the ~3 KB product image.

### Images are not the main payload driver

Product detail image transfer is **2907 bytes (~2.8 KB)** — negligible vs **676 KB** total. The above-fold product image is not the primary byte-weight or LCP bottleneck. Dominant contributors are **JavaScript (~415 KB)**, **global CSS (~106 KB)**, and **extra font bytes on product detail (~69 KB vs ~45 KB elsewhere)**.

### Shared resource baseline (cross-route)

| Resource type | Typical bytes | Notes |
| --- | ---: | --- |
| CSS (stylesheet) | 106083 | Constant across all 14 URLs; includes `@radix-ui/themes/styles.css` via `globals.css` |
| Font | 44686 | Home, about, contact, blog, listing |
| Font | 69088 | Product detail only (+24 KB) |
| JS (shared shell) | ~362037–369941 | Layout shell: header islands, motion, cookie consent, theme |
| JS (contact delta) | +~31800 | Contact pages: 399629 vs 367834 home |
| JS (product detail delta) | +~47231 | Product detail: 415065 vs 367834 home |

## Stop line

**Wave 1A stops at Task 2.** This document is baseline evidence only — no repairs,
no threshold changes. `lighthouserc.js` was read only; no threshold edits.

Task 3 (env split) requires Codex approval of the Task 3 addendum before any
code changes. Full Wave 1 verification runs only after repairs land.
