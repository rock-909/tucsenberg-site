/**
 * Step 4.1 Phase D — D1.
 *
 * The rebuilt `/compatible/[brand]` page composes Phase-A trust primitives
 * around four new `compatibleBrand.*` subtrees (`boundary`, `intake`,
 * `stats`, `cta`). Every new leaf must be a real, non-empty, non-TODO
 * string in all three runtime locales, the Spanish must be real Spanish
 * (not an English copy), and the stats summary must stay ICU-driven
 * (`{paths}`) rather than baking the fabricated "6 documented"/"228"
 * literals that the content-stripped page used to carry.
 */
import enCritical from "../../messages/en/critical.json";
import esCritical from "../../messages/es/critical.json";
import zhCritical from "../../messages/zh/critical.json";
import { describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

const LOCALES = [
  ["en", enCritical as JsonObject],
  ["es", esCritical as JsonObject],
  ["zh", zhCritical as JsonObject],
] as const;

const NEW_LEAVES = [
  "boundary.eyebrow",
  "boundary.title",
  "boundary.body",
  "intake.eyebrow",
  "intake.title",
  "intake.body",
  "stats.summary",
  "stats.epdm",
  "stats.tpu",
  "cta.eyebrow",
  "cta.title",
  "cta.body",
  "cta.action",
] as const;

// Existing leaves other tests / the client filter still reference; D1 is
// additive and must not remove them.
const PRESERVED_LEAVES = [
  "disclaimer",
  "results.fitStatus",
  "results.confidence",
] as const;

const TODO_MARKER = /\[(?:ES|ZH|EN)-TODO\]/u;

function get(messages: JsonObject, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => {
    if (typeof node !== "object" || node === null) return undefined;
    return (node as JsonObject)[key];
  }, messages.compatibleBrand);
}

describe("compatibleBrand.* Phase-D narrative / stats / cta keys", () => {
  it.each(LOCALES)(
    "has every new %s leaf as a non-empty, non-TODO string",
    (_locale, messages) => {
      for (const leaf of NEW_LEAVES) {
        const value = get(messages, leaf);
        expect(typeof value, leaf).toBe("string");
        expect(String(value).trim(), leaf).not.toBe("");
        expect(TODO_MARKER.test(String(value)), `${leaf} TODO`).toBe(false);
      }
    },
  );

  it.each(LOCALES)("keeps the preserved %s leaves intact", (_locale, msgs) => {
    for (const leaf of PRESERVED_LEAVES) {
      const value = get(msgs, leaf);
      expect(typeof value, leaf).toBe("string");
      expect(String(value).trim(), leaf).not.toBe("");
    }
  });

  it("keeps stats.summary ICU-driven, not a fabricated literal count", () => {
    for (const [, messages] of LOCALES) {
      const summary = String(get(messages, "stats.summary"));
      expect(summary).toContain("{paths}");
      // The content-stripped page baked these fabricated numbers; the
      // rebuilt page derives every count from getBrandPathStats().
      expect(summary).not.toMatch(/\b6\s+documented\b/iu);
      expect(summary).not.toContain("228");
    }
    expect(String(get(enCritical as JsonObject, "stats.epdm"))).toContain(
      "{epdm}",
    );
    expect(String(get(enCritical as JsonObject, "stats.tpu"))).toContain(
      "{tpu}",
    );
  });

  it("uses {brand} ICU in the boundary/intake body, single sales mailbox", () => {
    const enBoundary = String(get(enCritical as JsonObject, "boundary.body"));
    expect(enBoundary).toContain("{brand}");
    const enCta = String(get(enCritical as JsonObject, "cta.body"));
    expect(enCta).toContain("sales@tucsenberg.com");
  });

  it("does not ship Spanish as an English copy for the new leaves", () => {
    for (const leaf of NEW_LEAVES) {
      const en = String(get(enCritical as JsonObject, leaf));
      const es = String(get(esCritical as JsonObject, leaf));
      // `stats.*` are ICU-token-dominant lines; allow those to coincide.
      if (leaf.startsWith("stats.")) continue;
      expect(es, `${leaf} must be real Spanish`).not.toBe(en);
    }
  });
});
