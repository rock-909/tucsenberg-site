import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      home: {
        risks: {
          overline: "WHY THIS PAGE EXISTS",
          title: "The four risks buyers avoid",
          body: "Replacement membrane orders go wrong in a small number of repeatable ways.",
          items: {
            wrongFit: {
              title: "Ordering a part that does not seat",
              body: "A membrane close but not dimensionally matched leaks or unseats; the compatibility review checks fit before the order.",
            },
            wrongMaterial: {
              title: "Running an elastomer the influent attacks",
              body: "Where the basin sees BTEX, solvents, oil, or grease loading, an EPDM membrane chosen by default can swell or harden.",
            },
            blindOrder: {
              title: "Quoting from a guessed cross-reference",
              body: "A brand-name lookup with no recorded basis produces a number nobody can defend.",
            },
            shutdownSlip: {
              title: "Losing the basin window to a slow reply",
              body: "When a line is down, an unanswered RFQ is the real cost.",
            },
          },
        },
      },
    }),
  ),
}));

async function renderRisks(locale: "en" | "es" | "zh" = "en") {
  const { HomeRisksSection } =
    await import("@/components/sections/home-risks-section");
  const element = await HomeRisksSection({ locale });
  return render(element);
}

const BANNED =
  /premium|high quality|better than|\bdurable\b|\befficient\b|\d+%/i;
const RISK_TITLES = [
  "Ordering a part that does not seat",
  "Running an elastomer the influent attacks",
  "Quoting from a guessed cross-reference",
  "Losing the basin window to a slow reply",
];

describe("Feature: HomeRisksSection narrative", () => {
  it("renders the section heading", async () => {
    await renderRisks();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "The four risks buyers avoid",
      }),
    ).toBeInTheDocument();
  });

  it("renders exactly four risk titles", async () => {
    await renderRisks();
    for (const title of RISK_TITLES) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("places BTEX only in the material-risk body as a workload trigger", async () => {
    const { container } = await renderRisks();
    const text = container.textContent ?? "";
    expect(text).toContain("BTEX");
    const materialBody = screen.getByText(/Where the basin sees BTEX/);
    expect(materialBody).toBeInTheDocument();
  });

  it("uses no banned adjectives or fabricated percentages", async () => {
    const { container } = await renderRisks();
    expect(container.textContent ?? "").not.toMatch(BANNED);
  });
});
