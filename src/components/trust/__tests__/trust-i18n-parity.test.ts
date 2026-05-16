import { describe, expect, it } from "vitest";

import enCritical from "../../../../messages/en/critical.json";
import esCritical from "../../../../messages/es/critical.json";
import zhCritical from "../../../../messages/zh/critical.json";

type MessageTree = Record<string, unknown>;

const LOCALES = {
  en: enCritical as MessageTree,
  es: esCritical as MessageTree,
  zh: zhCritical as MessageTree,
} as const;

/**
 * Leaf paths the 6 A2 trust primitives read (byte-for-byte the
 * readMessagePath path arrays in src/components/trust/*). If any of these
 * is missing or non-string in any locale, the corresponding component
 * silently falls back to a bare key segment, so this pins them across
 * en / es / zh.
 */
const REQUIRED_LEAF_PATHS: readonly (readonly string[])[] = [
  ["trust", "sla", "review"],
  ["trust", "sla", "standardRfq"],
  ["trust", "sla", "urgent"],
  ["trust", "proof", "title"],
  ["trust", "proof", "body"],
  ["trust", "material", "title"],
  ["trust", "material", "epdm", "label"],
  ["trust", "material", "epdm", "condition"],
  ["trust", "material", "tpu", "label"],
  ["trust", "material", "tpu", "condition"],
  ["trust", "material", "note"],
  ["trust", "batch", "title"],
  ["trust", "batch", "traceability"],
  ["trust", "batch", "photos"],
  ["trust", "batch", "sample"],
  ["legal", "trademark", "footer"],
  ["legal", "trademark", "brandNotice"],
  ["legal", "trademark", "inline"],
];

function readLeaf(tree: MessageTree, path: readonly string[]): unknown {
  let current: unknown = tree;
  for (const segment of path) {
    if (
      typeof current !== "object" ||
      current === null ||
      !(segment in current)
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

describe("Behavior: shared trust/legal i18n parity", () => {
  for (const [locale, tree] of Object.entries(LOCALES)) {
    for (const path of REQUIRED_LEAF_PATHS) {
      it(`${locale}: ${path.join(".")} is a non-empty string`, () => {
        const value = readLeaf(tree, path);
        expect(typeof value).toBe("string");
        expect((value as string).trim().length).toBeGreaterThan(0);
      });
    }
  }

  it("legal.trademark.footer keeps the literal {brands} placeholder in every locale", () => {
    for (const [, tree] of Object.entries(LOCALES)) {
      const footer = readLeaf(tree, ["legal", "trademark", "footer"]);
      expect(footer).toContain("{brands}");
    }
  });

  it("legal.trademark.brandNotice keeps the literal {brand} placeholder in every locale", () => {
    for (const [, tree] of Object.entries(LOCALES)) {
      const notice = readLeaf(tree, ["legal", "trademark", "brandNotice"]);
      expect(notice).toContain("{brand}");
    }
  });

  it("legal.trademark.footer never reintroduces the struck legal entity (R5/§6)", () => {
    for (const [, tree] of Object.entries(LOCALES)) {
      const footer = readLeaf(tree, ["legal", "trademark", "footer"]) as string;
      expect(footer).not.toMatch(/proforma|pro forma|\bPI\b|Co\.,? Ltd/i);
    }
  });

  /**
   * Hard CLAUDE.md #3 compliance lock against the REAL shipped copy
   * (Step 4.1 §6.2 PROJECT-BRIEF variant A): both the brand-notice and
   * the footer trademark disclaimer must express the generic
   * "trademark of / property of their respective owner(s)" ownership
   * concept in every runtime locale. The mocked-copy component test
   * (`trademark-disclaimer.test.tsx`) proves the rendering path; this
   * proves the actual `messages/{en,es,zh}/critical.json` ships
   * §6.2-compliant wording. Per-locale substring/regex pins are robust
   * to minor future copy edits (no brittle full-string equality):
   * EN "respective owner", ES "respectivo(s) propietario(s)",
   * ZH "各自所有者".
   */
  const RESPECTIVE_OWNER_BY_LOCALE = {
    en: /respective owners?/i,
    es: /respectivos? propietarios?/i,
    zh: /各自所有者/,
  } as const;

  for (const leaf of ["footer", "brandNotice"] as const) {
    for (const [locale, tree] of Object.entries(LOCALES)) {
      it(`legal.trademark.${leaf} carries the §6.2 generic "respective owner" ownership wording in ${locale}`, () => {
        const value = readLeaf(tree, ["legal", "trademark", leaf]) as string;
        const pattern =
          RESPECTIVE_OWNER_BY_LOCALE[
            locale as keyof typeof RESPECTIVE_OWNER_BY_LOCALE
          ];
        expect(value).toMatch(pattern);
      });
    }
  }
});
