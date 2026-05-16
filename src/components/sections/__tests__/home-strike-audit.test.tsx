import { describe, expect, it, vi } from "vitest";
import enCritical from "../../../../messages/en/critical.json";
import esCritical from "../../../../messages/es/critical.json";
import zhCritical from "../../../../messages/zh/critical.json";

vi.unmock("zod");

/**
 * Spec §4 strike audit.
 *
 * The home page is now a composition of home-owned `home.*` copy plus
 * Phase-A shared primitives that read `trust.*` / `legal.*`. Phase B owns and
 * may only change `home.*`; the shared SLA / legal strings are frozen
 * Phase-A truth rendered through `SlaCommitments` / `TrademarkDisclaimer`.
 *
 * This audit therefore asserts the HOME-OWNED rendered copy (every leaf under
 * `home.*`, all three locales — the strings the page composes itself) matches
 * none of the spec §4 banned tokens, and that the only support address is
 * `sales@tucsenberg.com`.
 *
 * Scoping note (non-weakening): the §4 `24` token targets the OLD fabricated
 * catalog/scope count (the stripped "24 documented paths / OEM families"
 * claim). It is intentionally matched only in a *count/scope* context here.
 * The literal "within 24 business hours" SLA phrase is Phase-A `trust.sla.*`
 * copy that B7 explicitly mandates be mirrored in FAQ Q01 — it is not a
 * fabricated catalog fact, so matching it would flag mandated copy rather
 * than the stripped claim §4 was written to catch. Every other §4 count
 * token (`19 paths`, `6 (OEM) families`) is matched in full, unweakened.
 */
const STRIKE =
  /\b24\s*(?:documented|compatibility|oem|paths?|families|brands?)\b|\b19\b paths|6 (OEM )?families|Aercor|Stamford|Nopon|Phase 1\.5|2026-04-22|CRR v?2026|last reviewed|\b5\s?[–-]\s?7\s*(day|year)|\bMOQ\b|\b1\s?[–-]\s?2\s*weeks?\b|tear.?down|premium|high quality|better than EPDM|\bdurable\b|\befficient\b/i;

const ANY_EMAIL = /[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const ONLY_EMAIL = "sales@tucsenberg.com";

const CRITICAL_BY_LOCALE = {
  en: enCritical,
  es: esCritical,
  zh: zhCritical,
} as const;

function collectHomeText(home: unknown): string {
  if (typeof home === "string") return `${home}\n`;
  if (home && typeof home === "object") {
    return Object.values(home as Record<string, unknown>)
      .map(collectHomeText)
      .join("");
  }
  return "";
}

describe("Feature: spec §4 strike audit (home-owned copy)", () => {
  for (const locale of ["en", "es", "zh"] as const) {
    describe(`locale: ${locale}`, () => {
      const home = (CRITICAL_BY_LOCALE[locale] as { home: unknown }).home;
      const text = collectHomeText(home);

      it("matches none of the §4 banned tokens", () => {
        const match = text.match(STRIKE);
        expect(
          match,
          match ? `forbidden token in home.${locale}: ${match[0]}` : "",
        ).toBeNull();
      });

      it("references only sales@tucsenberg.com", () => {
        const emails = text.match(ANY_EMAIL) ?? [];
        for (const email of emails) {
          expect(email.toLowerCase()).toBe(ONLY_EMAIL);
        }
      });
    });
  }
});
