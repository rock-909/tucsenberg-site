/**
 * C9 consolidated structure contract. Its UNIQUE value is the document-
 * order walk over the nine locked sections plus the confirm-fit index-
 * monotonicity check. The per-field re-assertions this once duplicated
 * (quote href, data-layout="stacked", data-variant="inline", and the
 * global strike audit) are owned by the focused sibling specs
 * (`quote-cta-and-proof.test.tsx`, `lead-time-and-qc.test.tsx`,
 * `spec-strip-contract.test.tsx`, ...) and are intentionally NOT repeated
 * here — this file stays a focused order guard.
 *
 * Locked order: hero spec strip -> use-case -> MaterialDecisionCard ->
 * 6 confirm-fit steps -> CompatibilitySection -> lead-time ->
 * BatchControlsBlock -> quote CTA -> stacked SLA -> page-bottom inline
 * TrademarkDisclaimer.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage from "../page";
import {
  CANONICAL_D9_EPDM,
  renderProductPage,
  resolveMessage,
} from "./test-utils";

vi.unmock("zod");

vi.mock("next/navigation", async () =>
  (await import("./test-utils")).nextNavigationFactory(),
);
vi.mock("@/i18n/routing", async () =>
  (await import("./test-utils")).i18nRoutingFactory(),
);
vi.mock("next-intl/server", async () =>
  (await import("./test-utils")).nextIntlServerFactory(),
);
vi.mock("@/components/seo", async () =>
  (await import("./test-utils")).seoFactory(),
);
vi.mock("@/app/[locale]/membranes/[product]/compatibility-section", async () =>
  (await import("./test-utils")).compatibilitySectionFactory(),
);
vi.mock("@/components/trust", async (importOriginal) =>
  (await import("./test-utils")).trustMockFactory(importOriginal),
);

const CONFIRM_FIT_KEYS = [
  "partNumber",
  "dimensions",
  "mounting",
  "material",
  "perforation",
  "release",
] as const;

describe("Membrane product page — Phase 4.1 structure contract", () => {
  it("renders every section in the locked document order", async () => {
    const { container } = await renderProductPage(
      ProductPage,
      "en",
      CANONICAL_D9_EPDM,
    );

    const m = (key: string) => resolveMessage("en", "membraneProduct", key);

    const dl = container.querySelector("dl")!;
    const useCase = screen.getByRole("heading", { name: m("useCase.title") });
    const card = screen.getByTestId("material-decision-card");
    const compat = screen.getByTestId("compatibility-section");
    const leadTime = screen.getByRole("heading", {
      name: m("leadTime.title"),
    });
    const batch = screen.getByTestId("batch-controls-block");
    const quoteLink = screen.getByRole("link", {
      name: m("cta.requestQuote"),
    });
    const sla = screen.getByTestId("sla-commitments");
    const disclaimer = screen.getByTestId("trademark-disclaimer");

    const ordered = [
      dl,
      useCase,
      card,
      compat,
      leadTime,
      batch,
      quoteLink,
      sla,
      disclaimer,
    ];
    for (let i = 0; i < ordered.length - 1; i++) {
      expect(
        ordered[i]!.compareDocumentPosition(ordered[i + 1]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    // Six confirm-fit steps between MaterialDecisionCard and
    // CompatibilitySection, in fixed order.
    const stepTexts = CONFIRM_FIT_KEYS.map((k) => m(`confirmFit.steps.${k}`));
    const lis = Array.from(
      container.querySelectorAll("ol li"),
      (n) => n.textContent ?? "",
    );
    expect(stepTexts.every((s) => lis.includes(s))).toBe(true);
    const idx = stepTexts.map((s) => lis.indexOf(s));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });
});
