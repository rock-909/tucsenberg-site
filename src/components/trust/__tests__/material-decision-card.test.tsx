import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      trust: {
        material: {
          title: "Which membrane material fits your basin",
          epdm: {
            label: "EPDM — default starting point",
            condition:
              "EPDM is the default starting point for municipal and standard industrial diffused aeration.",
          },
          tpu: {
            label: "TPU — selected by conditions",
            condition:
              "TPU is triggered by specific conditions: oils, solvents, or aggressive industrial chemistry in the wastewater.",
          },
          note: "Material is chosen by process conditions, not as a price tier.",
        },
      },
    }),
  ),
}));

async function renderCard(defaultMaterial?: "epdm" | "tpu") {
  const { MaterialDecisionCard } =
    await import("@/components/trust/material-decision-card");
  const element = await MaterialDecisionCard({
    locale: "en",
    ...(defaultMaterial ? { defaultMaterial } : {}),
  });
  return render(element);
}

describe("Feature: MaterialDecisionCard primitive", () => {
  it("carries the root testid", async () => {
    await renderCard();
    expect(screen.getByTestId("material-decision-card")).toBeInTheDocument();
  });

  it("renders the EPDM and TPU paths", async () => {
    await renderCard();
    const root = screen.getByTestId("material-decision-card");
    expect(root).toHaveTextContent("default starting point");
    expect(root).toHaveTextContent("triggered by specific conditions");
  });

  it("renders the no-price-tier note", async () => {
    await renderCard();
    const root = screen.getByTestId("material-decision-card");
    expect(root).toHaveTextContent(
      "Material is chosen by process conditions, not as a price tier.",
    );
    expect(screen.getByTestId("material-note")).toBeInTheDocument();
  });

  it("marks the default material via data attribute", async () => {
    await renderCard("tpu");
    const root = screen.getByTestId("material-decision-card");
    expect(root).toHaveAttribute("data-default-material", "tpu");
  });

  it("defaults to epdm when no default material is given", async () => {
    await renderCard();
    const root = screen.getByTestId("material-decision-card");
    expect(root).toHaveAttribute("data-default-material", "epdm");
  });

  it("does not frame TPU as premium or better than EPDM", async () => {
    await renderCard();
    const root = screen.getByTestId("material-decision-card");
    expect(root.textContent ?? "").not.toMatch(/premium|better than/i);
  });
});
