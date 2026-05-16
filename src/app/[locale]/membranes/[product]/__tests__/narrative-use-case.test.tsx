/**
 * C4: the "What this product is for" narrative renders between the hero
 * spec strip and the compatibility section, sourced from
 * membraneProduct.useCase.* (resolved, not key passthrough).
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

describe("Membrane product page — use-case narrative", () => {
  it("renders the resolved use-case title between the hero spec strip and compatibility", async () => {
    const { container } = await renderProductPage(
      ProductPage,
      "en",
      CANONICAL_D9_EPDM,
    );

    const useCaseTitle = resolveMessage(
      "en",
      "membraneProduct",
      "useCase.title",
    );
    expect(useCaseTitle).toBe("A drop-in aeration membrane replacement");
    expect(screen.getByText(useCaseTitle)).toBeInTheDocument();

    // Document order: hero <dl> spec strip → use-case narrative →
    // compatibility section.
    const dl = container.querySelector("dl");
    const useCaseHeading = screen.getByRole("heading", {
      name: useCaseTitle,
    });
    const compat = screen.getByTestId("compatibility-section");

    expect(
      dl!.compareDocumentPosition(useCaseHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      useCaseHeading.compareDocumentPosition(compat) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
