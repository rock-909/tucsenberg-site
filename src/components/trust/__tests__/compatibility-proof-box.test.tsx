import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      trust: {
        proof: {
          title: "How we confirm the part matches",
          body: "We map your OEM model and part number against the documented compatibility table before quoting.",
        },
      },
    }),
  ),
}));

async function renderProof(extraChecks?: readonly string[]) {
  const { CompatibilityProofBox } =
    await import("@/components/trust/compatibility-proof-box");
  const element = await CompatibilityProofBox({
    locale: "en",
    ...(extraChecks ? { extraChecks } : {}),
  });
  return render(element);
}

describe("Feature: CompatibilityProofBox primitive", () => {
  it("carries the root testid", async () => {
    await renderProof();
    expect(screen.getByTestId("compatibility-proof-box")).toBeInTheDocument();
  });

  it("renders the title and body from i18n", async () => {
    await renderProof();
    const root = screen.getByTestId("compatibility-proof-box");
    expect(root).toHaveTextContent("How we confirm the part matches");
    expect(root).toHaveTextContent("documented compatibility table");
  });

  it("renders extra checks as a list", async () => {
    await renderProof([
      "Dimensional spec sheet on request",
      "Bubble pattern reference",
    ]);
    const root = screen.getByTestId("compatibility-proof-box");
    expect(root.querySelectorAll("li")).toHaveLength(2);
    expect(root).toHaveTextContent("Dimensional spec sheet on request");
  });

  it("omits the list when no extra checks", async () => {
    await renderProof();
    const root = screen.getByTestId("compatibility-proof-box");
    expect(root.querySelector("ul")).toBeNull();
  });

  it("does not promise a teardown / CRR comparison in the body", async () => {
    await renderProof();
    const root = screen.getByTestId("compatibility-proof-box");
    expect(root.textContent ?? "").not.toMatch(/tear.?down|CRR|teardown/i);
  });
});
