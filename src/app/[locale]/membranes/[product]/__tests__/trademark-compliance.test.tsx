/**
 * CLAUDE.md #3 compliance: every OEM-compatibility page must carry a
 * page-level trademark disclaimer. The per-brand `brand-notice` disclaimers
 * inside `CompatibilitySection` are a separate, in-section concern and are
 * NOT the page-level one this test pins. The shared harness stubs
 * `CompatibilitySection` away entirely, so the only `TrademarkDisclaimer`
 * that can render is the page-level `variant="inline"` block, and we assert
 * it renders AFTER the (stubbed) compatibility section.
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

describe("Membrane product page — trademark compliance", () => {
  it("renders a page-level inline trademark disclaimer after the compatibility section", async () => {
    const { container } = await renderProductPage(
      ProductPage,
      "en",
      CANONICAL_D9_EPDM,
    );

    const disclaimer = screen.getByTestId("trademark-disclaimer");
    expect(disclaimer).toBeInTheDocument();
    expect(disclaimer).toHaveAttribute("data-variant", "inline");

    const compat = screen.getByTestId("compatibility-section");

    // Document order: the page-level disclaimer must come AFTER the
    // compatibility section, proving it is the page-bottom one (not an
    // in-section per-brand notice, which is stubbed out anyway).
    const order = container.querySelectorAll(
      '[data-testid="compatibility-section"],[data-testid="trademark-disclaimer"]',
    );
    expect(order[0]).toBe(compat);
    expect(order[order.length - 1]).toBe(disclaimer);
  });
});
