/**
 * Quote (RFQ) page i18n parity + content contract — Step 4.1 Phase E.
 *
 * Phase E wraps the byte-frozen RFQ form with Phase-A narrative/trust
 * copy. This pins the `quote.*` namespace across en / es / zh:
 *
 * - identical key sets in all three locales (additive parity);
 * - the new narrative/trust subtrees exist;
 * - no banned vague adjective and no numeric lead-time / quantity
 *   promise leaks into any buyer-visible `quote.*` value;
 * - the path-adaptive form copy never reintroduces a struck
 *   quantity-band / MOQ / lead-time-table concept (E3);
 * - exactly one inbox: no quote@/quality@/legal@ routing address, and
 *   any email is the single sales inbox (E9);
 * - R5: both consent variants + the review-terms link keys exist
 *   (parity-safe) even though Phase E renders only the privacy-only
 *   consent.
 */
import { describe, expect, it } from "vitest";

import enCritical from "../../../../../messages/en/critical.json";
import esCritical from "../../../../../messages/es/critical.json";
import zhCritical from "../../../../../messages/zh/critical.json";

type Tree = Record<string, unknown>;

const LOCALES = {
  en: (enCritical as Tree).quote as Tree,
  es: (esCritical as Tree).quote as Tree,
  zh: (zhCritical as Tree).quote as Tree,
} as const;

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") {
      Object.assign(out, flatten(value as Tree, path));
    } else {
      out[path] = String(value);
    }
  }
  return out;
}

const FLAT = {
  en: flatten(LOCALES.en),
  es: flatten(LOCALES.es),
  zh: flatten(LOCALES.zh),
} as const;

function readPath(tree: Tree, dotted: string): unknown {
  let node: unknown = tree;
  for (const seg of dotted.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[seg];
  }
  return node;
}

describe("quote.* i18n parity", () => {
  it("has identical key sets across en / es / zh", () => {
    const enKeys = Object.keys(FLAT.en).sort();
    expect(Object.keys(FLAT.es).sort()).toEqual(enKeys);
    expect(Object.keys(FLAT.zh).sort()).toEqual(enKeys);
  });

  it("keeps the frozen softEntry / form / summary / success subtrees", () => {
    for (const tree of Object.values(LOCALES)) {
      expect(readPath(tree, "hero.title")).toBeTypeOf("string");
      expect(readPath(tree, "softEntry.title")).toBeTypeOf("string");
      expect(readPath(tree, "softEntry.body")).toBeTypeOf("string");
      expect(readPath(tree, "form.partNumbers")).toBeTypeOf("string");
      expect(readPath(tree, "summary.responseTimeValue")).toBeTypeOf("string");
      expect(readPath(tree, "success.title")).toBeTypeOf("string");
      expect(readPath(tree, "success.fileNotice")).toBeTypeOf("string");
    }
  });

  it("defines the Phase-E narrative + trust subtrees in every locale", () => {
    const required = [
      "intake.eyebrow",
      "intake.title",
      "intake.body",
      "materialGuidance.eyebrow",
      "materialGuidance.title",
      "materialGuidance.body",
      "whatHappensNext.eyebrow",
      "whatHappensNext.title",
      "proof.eyebrow",
      "proof.title",
      "proof.body",
      "batch.eyebrow",
      "batch.title",
      "assurances.nonBinding",
      "assurances.privacy",
      "legal.consent",
      "legal.consentWithReviewTerms",
      "legal.privacyLinkLabel",
      "legal.reviewTermsLinkLabel",
    ];
    for (const [locale, tree] of Object.entries(LOCALES)) {
      for (const path of required) {
        const value = readPath(tree, path);
        expect(
          typeof value === "string" && value.trim().length > 0,
          `${locale}.quote.${path}`,
        ).toBe(true);
      }
    }
  });

  it("keeps the ICU rich-text placeholders untranslated in every locale", () => {
    for (const tree of Object.values(LOCALES)) {
      expect(readPath(tree, "legal.consent")).toContain("<privacyLink>");
      const dual = readPath(tree, "legal.consentWithReviewTerms") as string;
      expect(dual).toContain("<privacyLink>");
      expect(dual).toContain("<reviewTermsLink>");
    }
  });
});

describe("quote.* content compliance", () => {
  // CLAUDE.md #4 vague-adjective ban + #2 TPU-not-premium.
  const BANNED =
    /\b(premium|high[\s-]?quality|efficient|durable|best[\s-]?in[\s-]?class|world[\s-]?class|cutting[\s-]?edge|state[\s-]?of[\s-]?the[\s-]?art)\b/i;
  // No numeric lead-time / quantity promise in buyer-visible copy.
  const NUMERIC_PROMISE = /\b\d+\s*(weeks?|days?|pcs?|pieces?)\b/i;

  for (const [locale, flat] of Object.entries(FLAT)) {
    for (const [key, value] of Object.entries(flat)) {
      // ICU `{email}` substitution + "2 business days" SLA copy are
      // frozen, owner-approved exceptions to the numeric-promise guard:
      // they are a response-SLA, not a lead-time/quantity promise.
      const isSlaResponseCopy =
        key === "hero.description" ||
        key === "summary.responseTimeValue" ||
        key === "success.description";

      it(`${locale}.quote.${key} carries no banned adjective`, () => {
        expect(value).not.toMatch(BANNED);
      });

      if (!isSlaResponseCopy) {
        it(`${locale}.quote.${key} makes no numeric lead/quantity promise`, () => {
          expect(value).not.toMatch(NUMERIC_PROMISE);
        });
      }
    }
  }

  it("strikes any quantity-band / MOQ / lead-time-table concept from form copy", () => {
    const bandLike = /\b(band|moq|minimum\s*order|lead[\s-]?time\s*table)\b/i;
    for (const [locale, tree] of Object.entries(LOCALES)) {
      const form = readPath(tree, "form") as Tree;
      for (const [key, value] of Object.entries(flatten(form, "form"))) {
        expect(
          bandLike.test(value),
          `${locale}.quote.${key} reintroduced a struck band/MOQ/table`,
        ).toBe(false);
      }
      // quantity / shutdownDate hints must not pin a piece-count or
      // week-band number.
      const qtyHint = readPath(tree, "form.quantityHint") as string;
      const shutHint = readPath(tree, "form.shutdownDateHint") as string;
      expect(qtyHint).not.toMatch(/\b\d+\s*(pcs?|pieces?|weeks?)\b/i);
      expect(shutHint).not.toMatch(/\b\d+\s*weeks?\b/i);
    }
  });

  it("locks a single sales inbox (no quote@/quality@/legal@ routing)", () => {
    const ROUTING_INBOX = /\b(quote|quality|legal)@/i;
    const ANY_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    for (const [locale, flat] of Object.entries(FLAT)) {
      for (const [key, value] of Object.entries(flat)) {
        expect(
          ROUTING_INBOX.test(value),
          `${locale}.quote.${key} uses a route-by-intent inbox`,
        ).toBe(false);
        for (const email of value.match(ANY_EMAIL) ?? []) {
          expect(email).toBe("sales@tucsenberg.com");
        }
      }
    }
  });

  it("ships real translated ES + ZH (no English-identical / ES-TODO leaks)", () => {
    for (const [key, enValue] of Object.entries(FLAT.en)) {
      expect(FLAT.es[key]).not.toMatch(/\[ES-TODO\]/i);
      expect(FLAT.zh[key]).not.toMatch(/\[ES-TODO\]/i);
      // ICU/email/label-only leaves are legitimately locale-stable; only
      // assert real translation on the prose-bearing narrative subtrees.
      const isProse =
        /^(intake|materialGuidance|whatHappensNext|proof|batch|assurances)\./.test(
          key,
        );
      if (isProse && enValue.length > 24) {
        expect(FLAT.es[key], `es.quote.${key} is English-identical`).not.toBe(
          enValue,
        );
        expect(FLAT.zh[key], `zh.quote.${key} is English-identical`).not.toBe(
          enValue,
        );
      }
    }
  });
});
