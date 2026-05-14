import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QualitySection } from "@/components/sections/quality-section";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("QualitySection", () => {
  it("renders without crashing", async () => {
    await renderAsyncComponent(QualitySection());
    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
  });

  it("renders section subtitle", async () => {
    await renderAsyncComponent(QualitySection());
    expect(screen.getByText("subtitle")).toBeInTheDocument();
  });

  it("renders 5 commitment cards with titles and descriptions", async () => {
    await renderAsyncComponent(QualitySection());

    const keys = [
      "commitment1",
      "commitment2",
      "commitment3",
      "commitment4",
      "commitment5",
    ];
    for (const key of keys) {
      expect(screen.getByText(`${key}.title`)).toBeInTheDocument();
      expect(screen.getByText(`${key}.desc`)).toBeInTheDocument();
    }
  });

  it("renders ISO 9001 certification with certificate number", async () => {
    await renderAsyncComponent(QualitySection());

    expect(screen.getByText("certifications.iso9001")).toBeInTheDocument();
    expect(screen.getByText("certifications.iso9001Num")).toBeInTheDocument();
    expect(
      screen.getAllByText("certifications.certified").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders 4 standards compliance labels", async () => {
    await renderAsyncComponent(QualitySection());

    expect(screen.getByText("standards.exampleA")).toBeInTheDocument();
    expect(screen.getByText("standards.exampleB")).toBeInTheDocument();
    expect(screen.getByText("standards.exampleC")).toBeInTheDocument();
    expect(screen.getByText("standards.exampleD")).toBeInTheDocument();
  });

  it("renders applying badge for the second example standard", async () => {
    await renderAsyncComponent(QualitySection());

    expect(screen.getByText("certifications.applying")).toBeInTheDocument();
  });

  it("renders logo wall placeholder", async () => {
    await renderAsyncComponent(QualitySection());
    expect(screen.getByText("logoWall")).toBeInTheDocument();
  });
});
