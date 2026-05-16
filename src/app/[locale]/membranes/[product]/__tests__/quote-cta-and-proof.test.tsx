/**
 * C8: the bare CTA section becomes a quote panel keeping the EXACT
 * existing quoteHref, plus quote.* eyebrow/title/body, a single
 * sales@tucsenberg.com mailto, the frozen CompatibilityProofBox, and the
 * frozen SlaCommitments with layout="stacked". The page-bottom inline
 * TrademarkDisclaimer stays the final element. No other contact mailbox,
 * no struck "tear-down".
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage from "../page";
import { CANONICAL_D9_EPDM, renderProductPage } from "./test-utils";

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

describe("Membrane product page — quote CTA panel + proof", () => {
  it("keeps the exact quoteHref and mounts proof + stacked SLA + single sales email", async () => {
    const { container } = await renderProductPage(
      ProductPage,
      "en",
      CANONICAL_D9_EPDM,
    );

    // Regression fence: quote link href byte-unchanged.
    expect(
      screen.getByRole("link", { name: "Request Quote for This Part" }),
    ).toHaveAttribute(
      "href",
      `/quote?sku=TUC-D9-EPDM&product=${CANONICAL_D9_EPDM}`,
    );

    expect(screen.getByTestId("compatibility-proof-box")).toBeInTheDocument();
    const sla = screen.getByTestId("sla-commitments");
    expect(sla).toHaveAttribute("data-layout", "stacked");

    const pageText = container.textContent ?? "";
    expect(pageText).toContain("sales@tucsenberg.com");
    expect(pageText).not.toMatch(/quote@|quality@|legal@/i);
    expect(pageText).not.toMatch(/tear.?down/i);

    // Single sales email surfaced as a mailto.
    expect(
      container.querySelector('a[href="mailto:sales@tucsenberg.com"]'),
    ).not.toBeNull();

    // Page-bottom inline trademark disclaimer remains the final element.
    const disclaimer = screen.getByTestId("trademark-disclaimer");
    expect(disclaimer).toHaveAttribute("data-variant", "inline");
    expect(
      sla.compareDocumentPosition(disclaimer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
