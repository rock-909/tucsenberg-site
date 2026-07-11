> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Optional Social Launch Gate Design

## Intent

The public-launch config gate must block fake starter social profile URLs, but
it must not require Tucsenberg to publish social links when owner truth says no
official Twitter/X or LinkedIn profile is available yet.

## Source evidence

- `docs/audits/上线就绪问题清单-2026-07-05.md` records the intended fix for
  fake Organization JSON-LD social profiles: clear the social keys and omit
  `sameAs` when empty.
- `src/config/single-site.ts` currently sets `social.twitter` and
  `social.linkedin` to empty strings.
- `src/config/__tests__/paths.test.ts` treats social links as optional URLs:
  empty string or HTTP URL is valid.
- `scripts/quality/checks/production-config.js` currently uses the generic
  starter marker check for social links; that generic check treats an empty
  value as not launch-ready.

## Target behavior

```gherkin
Given the site has no owner-confirmed social profiles
When the strict public-launch config gate checks SITE_CONFIG.social.*
Then empty social values are accepted
And Organization JSON-LD can omit sameAs

Given the site contains starter social profile URLs such as x.com/example
When the strict public-launch config gate runs
Then those values are blocked as not public-launch ready
```

## Non-goals

- Do not invent social profile URLs.
- Do not weaken domain, secret, phone, legal review, or product photo launch
  blockers.
- Do not change structured data generation, because it already omits `sameAs`
  for an empty social list.
