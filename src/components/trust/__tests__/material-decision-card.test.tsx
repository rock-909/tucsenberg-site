import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      trust: {
        material: {
          title: "Which membrane material fits your basin",
          epdmLabel: "EPDM",
          epdmBody:
            "EPDM is the default starting point for municipal and standard industrial diffused aeration.",
          tpuLabel: "TPU",
          tpuBody:
            "TPU is triggered by specific conditions: oils, solvents, or aggressive industrial chemistry in the wastewater.",
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
