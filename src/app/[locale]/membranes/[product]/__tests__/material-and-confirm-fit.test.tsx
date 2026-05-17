/**
 * C5: a material-fit section mounts the frozen MaterialDecisionCard
 * (defaultMaterial="epdm"), followed by a confirm-fit process section that
 * lists all six membraneProduct.confirmFit.steps.* in fixed order. The
 * confirm-fit copy carries no lead-time/quantity/temperature numbers
 * (those belong to dedicated later sections / are struck).
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage from "../page";
import {
  CANONICAL_D9_EPDM,
  CANONICAL_D9_TPU,
  renderProductPage,
  resolveMessage,
} from "./test-utils";

vi.unmock("zod");

// Per-test override: a MaterialDecisionCard stub that records its props so
// the `defaultMaterial="epdm"` contract is asserted. Hoisted so the
// trust-mock factory can reference it.
const { materialDecisionSpy } = vi.hoisted(() => ({
  materialDecisionSpy: vi.fn(),
}));

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
  (await import("./test-utils")).trustMockFactory(importOriginal, {
    MaterialDecisionCard: (props: { defaultMaterial?: string }) => {
      materialDecisionSpy(props);
      return (
        <section
          data-testid="material-decision-card"
          data-default-material={props.defaultMaterial}
        />
      );
    },
  }),
);

const CONFIRM_FIT_KEYS = [
  "partNumber",
  "dimensions",
  "mounting",
  "material",
  "perforation",
  "release",
] as const;

describe("Membrane product page — material fit + confirm fit", () => {
  it("mounts MaterialDecisionCard(epdm) and the six confirm-fit steps in order", async () => {
    materialDecisionSpy.mockClear();
    const { container } = await renderProductPage(
      ProductPage,
      "en",
      CANONICAL_D9_EPDM,
    );

    const card = screen.getByTestId("material-decision-card");
    expect(card).toHaveAttribute("data-default-material", "epdm");
    expect(materialDecisionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ defaultMaterial: "epdm" }),
    );

    const steps = CONFIRM_FIT_KEYS.map((k) =>
      resolveMessage("en", "membraneProduct", `confirmFit.steps.${k}`),
    );
    const listItems = Array.from(
      container.querySelectorAll("ol li"),
      (n) => n.textContent ?? "",
    );
    for (const step of steps) {
      expect(listItems).toContain(step);
    }
    // Fixed order.
    const indexes = steps.map((s) => listItems.indexOf(s));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));

    // Confirm-fit copy must not carry lead-time / quantity / temperature.
    const confirmRegion = steps.join(" ");
    expect(confirmRegion).not.toMatch(
      /\d+\s*(day|days|business day|week|weeks)\b/i,
    );
    expect(confirmRegion).not.toMatch(/500\+?\s*(piece|pcs|pieces)/i);
    expect(confirmRegion).not.toMatch(/°C/);
  });

  it("aligns TPU product pages with TPU material guidance", async () => {
    materialDecisionSpy.mockClear();
    await renderProductPage(ProductPage, "en", CANONICAL_D9_TPU);

    expect(
      screen.getByRole("heading", {
        name: "TPU is selected when basin conditions require it",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This TPU membrane is still reviewed against wastewater conditions and documented fit. Use the decision below to confirm when TPU is the correct workload match rather than treating it as a price tier.",
      ),
    ).toBeInTheDocument();

    const card = screen.getByTestId("material-decision-card");
    expect(card).toHaveAttribute("data-default-material", "tpu");
    expect(materialDecisionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ defaultMaterial: "tpu" }),
    );
  });
});
