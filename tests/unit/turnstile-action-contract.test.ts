import { describe, expect, it } from "vitest";

import { getAllowedTurnstileActions } from "@/lib/security/turnstile-config";

/**
 * Turnstile action contract.
 *
 * Every Turnstile `action` string a shipped public form/route actually uses
 * must be present in the default allowed-actions config. These literals are
 * grepped from the real call sites, not guessed:
 *
 * - `contact_form`        — `/api/contact` route + contact form widget
 * - `product_inquiry`     — `src/app/api/inquiry/route.ts` `expectedAction`
 * - `newsletter_subscribe`— `src/app/api/subscribe/route.ts` `expectedAction`
 *                           and the subscribe form `<LazyTurnstile action>`
 * - `rfq_quote`           — `src/app/api/quote/route.ts` `expectedAction`
 *                           and `src/app/[locale]/quote/quote-form.tsx`
 *                           `<LazyTurnstile action="rfq_quote">`
 *
 * If a public form ships an action the server default does not allow, a
 * deployment without an explicit `TURNSTILE_ALLOWED_ACTIONS` override would
 * reject every real submission for that form. This test fails closed on that
 * regression.
 */
const PUBLIC_TURNSTILE_ACTIONS = [
  "contact_form",
  "product_inquiry",
  "newsletter_subscribe",
  "rfq_quote",
] as const;

describe("Turnstile public action contract", () => {
  it("includes every public form/route action in the default allowlist", () => {
    const allowed = new Set(getAllowedTurnstileActions());

    for (const action of PUBLIC_TURNSTILE_ACTIONS) {
      expect(allowed.has(action), action).toBe(true);
    }
  });

  it("allows the shipped RFQ quote action specifically", () => {
    expect(getAllowedTurnstileActions()).toContain("rfq_quote");
  });
});
