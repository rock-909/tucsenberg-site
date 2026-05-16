import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      trust: {
        sla: {
          review: "Compatibility review answered within one business day.",
          standardRfq: "Standard RFQ quoted on the published schedule.",
          urgent: "Urgent line-down requests flagged for priority handling.",
        },
      },
    }),
  ),
}));

async function renderSla(layout: "ribbon" | "stacked" = "ribbon") {
  const { SlaCommitments } = await import("@/components/trust/sla-commitments");
  const element = await SlaCommitments({ locale: "en", layout });
  return render(element);
}

describe("Feature: SlaCommitments primitive", () => {
  it("carries the wrapper testid and data-layout", async () => {
    await renderSla("stacked");
    const root = screen.getByTestId("sla-commitments");
    expect(root).toHaveAttribute("data-layout", "stacked");
  });

  it("renders exactly three commitment items", async () => {
    await renderSla();
    const items = screen.getAllByTestId("sla-commitment");
    expect(items).toHaveLength(3);
  });

  it("renders the three commitment strings", async () => {
    await renderSla();
    const root = screen.getByTestId("sla-commitments");
    expect(root).toHaveTextContent("Compatibility review answered");
    expect(root).toHaveTextContent("Standard RFQ quoted");
    expect(root).toHaveTextContent("Urgent line-down requests");
  });

  it("never adds a fourth promise", async () => {
    await renderSla();
    expect(screen.getAllByTestId("sla-commitment")).not.toHaveLength(4);
  });

  it("uses no banned marketing adjectives", async () => {
    await renderSla();
    const root = screen.getByTestId("sla-commitments");
    expect(root.textContent ?? "").not.toMatch(
      /premium|high quality|efficient|durable|better than/i,
    );
  });
});
