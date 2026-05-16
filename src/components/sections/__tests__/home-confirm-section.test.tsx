import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      home: {
        confirm: {
          overline: "BEFORE YOU ORDER",
          title: "What we help you confirm",
          body: "We resolve replacement membrane requests against a documented compatibility review, not a brand-name guess.",
          points: {
            compatibility: {
              title: "OEM fit against your part number",
              body: "You send the diffuser part number or OEM model; we match it to the membrane variant the compatibility record already covers.",
            },
            material: {
              title: "Material chosen for your wastewater",
              body: "EPDM and TPU are scoped to the influent your basin actually sees.",
            },
            fit: {
              title: "Open questions surfaced before the quote",
              body: "If a dimension is unresolved, we flag it in the compatibility review before you commit to an order.",
            },
          },
        },
      },
    }),
  ),
}));

async function renderConfirm(locale: "en" | "es" | "zh" = "en") {
  const { HomeConfirmSection } =
    await import("@/components/sections/home-confirm-section");
  const element = await HomeConfirmSection({ locale });
  return render(element);
}

const BANNED = /premium|high quality|better than|\bdurable\b|\befficient\b/i;
const SLA_DIGITS = /\d+\s*business (hours|days)/i;

describe("Feature: HomeConfirmSection narrative", () => {
  it("renders the section heading", async () => {
    await renderConfirm();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "What we help you confirm",
      }),
    ).toBeInTheDocument();
  });

  it("renders all three confirmation point titles", async () => {
    await renderConfirm();
    expect(
      screen.getByText("OEM fit against your part number"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Material chosen for your wastewater"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Open questions surfaced before the quote"),
    ).toBeInTheDocument();
  });

  it("carries no SLA numbers in this narrative section", async () => {
    const { container } = await renderConfirm();
    expect(container.textContent ?? "").not.toMatch(SLA_DIGITS);
  });

  it("uses no banned marketing adjectives", async () => {
    const { container } = await renderConfirm();
    expect(container.textContent ?? "").not.toMatch(BANNED);
  });
});
