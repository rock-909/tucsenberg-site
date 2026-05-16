/**
 * Step 4.1 Phase D — D3.
 *
 * Locks the rebuilt brand-page composition: the top brand-notice
 * trademark disclaimer (scoped to the resolved brand), the two
 * narrative sections (boundary / intake), the trust blocks, the
 * request-a-review CTA pointing at `/quote?brand=<slug>`, the stacked
 * SLA commitments, and the footer trademark disclaimer as the final
 * block. Trust components are stubbed via the shared harness; only the
 * composition is asserted here (the components have their own coverage).
 */
import { describe, expect, it, vi } from "vitest";
import {
  i18nRoutingFactory,
  nextIntlServerFactory,
  nextNavigationFactory,
  renderBrandPage,
  resolveMessage,
  seoFactory,
  trustMockFactory,
} from "./test-utils";

vi.unmock("zod");
vi.mock("next/navigation", () => nextNavigationFactory());
vi.mock("@/i18n/routing", () => i18nRoutingFactory());
vi.mock("next-intl/server", () => nextIntlServerFactory());
vi.mock("@/components/seo", () => seoFactory());
vi.mock("@/components/trust", async (importOriginal) =>
  trustMockFactory(importOriginal as never),
);

const { default: BrandPage } = await import("../page");

describe("Phase D D3 — trust composition and narrative sections", () => {
  it("renders the top brand-notice disclaimer scoped to the resolved brand", async () => {
    await renderBrandPage(BrandPage, "en", "sanitaire");
    const { screen } = await import("@testing-library/react");

    const disclaimers = screen.getAllByTestId("trademark-disclaimer");
    const brandNotice = disclaimers.find(
      (n) => n.getAttribute("data-variant") === "brand-notice",
    );
    expect(brandNotice).toBeDefined();
    expect(brandNotice?.getAttribute("data-brand")).toBe("Sanitaire");
  });

  it("renders the footer trademark disclaimer as a distinct variant", async () => {
    await renderBrandPage(BrandPage, "en", "sanitaire");
    const { screen } = await import("@testing-library/react");

    const disclaimers = screen.getAllByTestId("trademark-disclaimer");
    const footer = disclaimers.find(
      (n) => n.getAttribute("data-variant") === "footer",
    );
    expect(footer).toBeDefined();
    // Both disclaimers present and distinguishable by variant.
    expect(
      new Set(disclaimers.map((n) => n.getAttribute("data-variant"))),
    ).toEqual(new Set(["brand-notice", "footer"]));
  });

  it("renders the boundary and intake narrative sections with brand ICU", async () => {
    await renderBrandPage(BrandPage, "en", "sanitaire");
    const { screen } = await import("@testing-library/react");

    expect(
      screen.getByText(
        resolveMessage("en", "compatibleBrand", "boundary.title", {
          brand: "Sanitaire",
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(resolveMessage("en", "compatibleBrand", "intake.title")),
    ).toBeInTheDocument();
    // The boundary body interpolates the brand display name.
    expect(
      screen.getByText(/Sanitaire is a third-party trademark/),
    ).toBeTruthy();
  });

  it("renders the request-review CTA linking to /quote?brand=<slug>", async () => {
    await renderBrandPage(BrandPage, "en", "sanitaire");
    const { screen } = await import("@testing-library/react");

    const ctaLabel = resolveMessage("en", "compatibleBrand", "cta.action");
    const cta = screen.getByRole("link", { name: ctaLabel });
    expect(cta.getAttribute("href")).toBe("/quote?brand=sanitaire");
  });

  it("mounts the trust blocks and stacked SLA commitments", async () => {
    await renderBrandPage(BrandPage, "en", "sanitaire");
    const { screen } = await import("@testing-library/react");

    expect(screen.getByTestId("material-decision-card")).toBeInTheDocument();
    expect(screen.getByTestId("compatibility-proof-box")).toBeInTheDocument();
    expect(screen.getByTestId("batch-controls-block")).toBeInTheDocument();
    const sla = screen.getByTestId("sla-commitments");
    expect(sla.getAttribute("data-layout")).toBe("stacked");
  });

  it("ends with the footer trademark disclaimer as the last page block", async () => {
    const { container } = await renderBrandPage(BrandPage, "en", "sanitaire");
    const root = container.firstElementChild;
    const last = root?.lastElementChild;
    const lastDisclaimer = last?.querySelector(
      '[data-testid="trademark-disclaimer"]',
    );
    expect(lastDisclaimer?.getAttribute("data-variant")).toBe("footer");
  });
});
