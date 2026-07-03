# SEO Public Surface Performance Headroom

**Date:** 2026-05-26
**Scope:** SEO public surface and blog article structured-data closeout.

## Commands

- `pnpm build`
- `CI_DAILY=true NODE_OPTIONS=--dns-result-order=ipv4first pnpm website:lighthouse`

## Result

- Build: passed.
- Lighthouse full sweep: passed hard gates.
- Global `total-byte-weight` warning threshold: unchanged at `490000` bytes.
- Indexable public pages kept the Lighthouse SEO hard gate at `0.9`.
- Product market detail URLs are intentionally `noindex` in the default public
  SEO profile, so Lighthouse does not apply the crawlability-based SEO category
  gate to that route class. Performance, accessibility, best-practices, Core
  Web Vitals, and byte gates still apply.

This is local Lighthouse lab evidence for the starter SEO public surface after
the SEO and JSON-LD changes. It is not a final customer-site performance
promise and does not represent field Core Web Vitals, RUM, or real-user
monitoring data.

## Route-class notes

The full sweep used the 14 public URLs configured in `lighthouserc.js`, with 3
Lighthouse runs per URL. Byte values below are Lighthouse `total-byte-weight`
network transfer bytes. The table lists representative route classes; all
audited URLs stayed below the `490000`-byte warning line.

| Route class | Representative URL | Lighthouse total-byte-weight bytes | Kept action |
| --- | --- | ---: | --- |
| Home | `/en` | 426514 | no code change without regression evidence |
| Contact | `/en/contact` | 470276 | no code change without regression evidence |
| Products list | `/en/products` | 426474 | no code change without regression evidence |
| Product detail | `/en/products/north-america` | 452586 | no code change without regression evidence |
| Blog list | `/en/blog` | 416797 | no code change without regression evidence |
| Blog article | `/en/blog/prepare-before-launch` | 418378 | no code change without regression evidence |

## Keep / stop decision

The SEO payload is kept because it adds sitemap coverage and JSON-LD signals. No Lighthouse threshold was raised. No business-visible content was removed.

If every audited URL remains under the 490000 byte warning line, this lane stops after documentation. If a route crosses the warning line, the next patch must cite the exact resource or import chain before changing code.
