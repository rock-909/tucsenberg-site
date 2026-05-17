import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      trust: {
        batch: {
          title: "How each production batch is controlled",
          traceability:
            "Every batch is logged against its OEM compatibility mapping and material spec.",
          photos:
            "Pre-shipment photos of the produced membranes are shared on request.",
          sample:
            "A reference sample can be sent before a full order is committed.",
        },
      },
    }),
  ),
}));

async function renderBlock() {
  const { BatchControlsBlock } =
    await import("@/components/trust/batch-controls-block");
  const element = await BatchControlsBlock({ locale: "en" });
  return render(element);
}

describe("Feature: BatchControlsBlock primitive", () => {
  it("carries the root testid", async () => {
    await renderBlock();
    expect(screen.getByTestId("batch-controls-block")).toBeInTheDocument();
  });

  it("renders title, traceability, photos and sample copy", async () => {
    await renderBlock();
    const root = screen.getByTestId("batch-controls-block");
    expect(root).toHaveTextContent("How each production batch is controlled");
    expect(root).toHaveTextContent("logged against its OEM compatibility");
    expect(root).toHaveTextContent("Pre-shipment photos");
    expect(root).toHaveTextContent("reference sample can be sent");
  });

  it("makes no hard lead-time, MOQ or warranty claims", async () => {
    await renderBlock();
    const root = screen.getByTestId("batch-controls-block");
    expect(root.textContent ?? "").not.toMatch(
      /\b5[–-]7\b|\bdays?\b|\b500\b|\byears?\b|\bMOQ\b/i,
    );
  });
});
