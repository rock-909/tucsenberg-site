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

/**
 * Phase 1 aftermarket validation v2 §3.1 + CLAUDE.md hard-rule:
 *
 *   "TPU 不写成 'premium' 或 'better than EPDM'，只写工况适配"
 *
 * USABlueBook public material guidance (cross-validated against EDI Aftermarket
 * Parts Shop and the aftermarket-market-validation Pro meta-synthesis) names
 * the explicit 100°F (38°C) operating temperature ceiling above which EPDM
 * (not TPU) is the correct material. Without this ceiling on the public
 * copy surface, a high-temperature wastewater buyer (textile dyeing, chemical
 * hot streams, food hot-side) could place a TPU order that fails in service —
 * exactly the after-sales dispute Phase 1 cannot afford.
 *
 * MaterialDecisionCard renders trust.material.tpu.condition on multiple pages
 * (home, product, compatible/[brand], quote). The product page also renders
 * membraneProduct.materialFit.tpu.body as the dedicated material-fit narrative.
 * Both surfaces share the same ceiling contract and the same premium/better-
 * than ban. The component-level MaterialDecisionCard test mocks copy and
 * cannot enforce shipped messages, so this guard pins the real
 * messages/{en,es,zh}/critical.json shipped to buyers.
 */
const TPU_SHARED_COPY_PATHS: readonly (readonly string[])[] = [
  ["trust", "material", "tpu", "condition"],
  ["membraneProduct", "materialFit", "tpu", "body"],
];

describe("Behavior: TPU operating temperature ceiling on shared public copy", () => {
  for (const path of TPU_SHARED_COPY_PATHS) {
    for (const [locale, tree] of Object.entries(LOCALES)) {
      it(`${locale}: ${path.join(".")} names the 100°F operating ceiling`, () => {
        const copy = readLeaf(tree, path) as string;
        expect(copy).toMatch(/100°F/);
      });

      it(`${locale}: ${path.join(".")} names the 38°C operating ceiling`, () => {
        const copy = readLeaf(tree, path) as string;
        expect(copy).toMatch(/38°C/);
      });

      it(`${locale}: ${path.join(".")} bans premium/better-than framing`, () => {
        const copy = readLeaf(tree, path) as string;
        expect(copy).not.toMatch(/premium|better than/i);
      });
    }
  }
});
