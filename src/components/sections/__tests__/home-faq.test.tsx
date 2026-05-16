import { describe, expect, it } from "vitest";
import enCritical from "../../../../messages/en/critical.json";
import esCritical from "../../../../messages/es/critical.json";
import zhCritical from "../../../../messages/zh/critical.json";

const CRITICAL_BY_LOCALE = {
  en: enCritical,
  es: esCritical,
  zh: zhCritical,
} as const;

const LOCALES = ["en", "es", "zh"] as const;

const BANNED_ADJECTIVE =
  /premium|high quality|better than|\bdurable\b|\befficient\b/i;
// Digit-form lead-time bands are banned; word-form ("one to two weeks") is
// allowed. "5-7 day" / "5–7 day" and MOQ / explicit year bands are banned.
const LEAD_TIME_BAND =
  /\b\d+\s?[–-]\s?\d+\s*(day|days|week|weeks|year|years)\b/i;
const FIVE_SEVEN_DAY = /\b5\s?[–-]\s?7\s*day/i;
const MOQ = /\bMOQ\b/;
const BAD_EMAIL = /quote@|quality@|legal@/i;
const ONLY_EMAIL = "sales@tucsenberg.com";
const ANY_EMAIL = /[a-z0-9._-]+@tucsenberg\.com/gi;

interface FaqLeaf {
  question: string;
  answer: string;
}

function loadHomeFaq(locale: (typeof LOCALES)[number]): {
  sectionTitle: string;
  items: Record<string, FaqLeaf>;
} {
  const critical = CRITICAL_BY_LOCALE[locale] as {
    home: { faq: { sectionTitle: string; items: Record<string, FaqLeaf> } };
  };
  return critical.home.faq;
}

describe("Feature: home FAQ content guard (Q01–Q06)", () => {
  for (const locale of LOCALES) {
    describe(`locale: ${locale}`, () => {
      const faq = loadHomeFaq(locale);
      const keys = Object.keys(faq.items);
      const allText = [
        faq.sectionTitle,
        ...keys.flatMap((k) => [faq.items[k]!.question, faq.items[k]!.answer]),
      ].join("\n");

      it("exposes exactly q01..q06", () => {
        expect(keys).toEqual(["q01", "q02", "q03", "q04", "q05", "q06"]);
      });

      it("uses no banned marketing adjectives", () => {
        expect(allText).not.toMatch(BANNED_ADJECTIVE);
      });

      it("carries no digit lead-time band, 5–7 day, or MOQ", () => {
        expect(allText).not.toMatch(LEAD_TIME_BAND);
        expect(allText).not.toMatch(FIVE_SEVEN_DAY);
        expect(allText).not.toMatch(MOQ);
      });

      it("uses only the sales@tucsenberg.com address", () => {
        expect(allText).not.toMatch(BAD_EMAIL);
        const emails = allText.match(ANY_EMAIL) ?? [];
        for (const email of emails) {
          expect(email.toLowerCase()).toBe(ONLY_EMAIL);
        }
      });
    });
  }
});
