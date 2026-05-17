import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.unmock("zod");

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      home: {
        membraneType: {
          overline: "FIND BY MEMBRANE TYPE",
          title: "Start from the membrane format you run",
          disc: {
            name: "Disc membranes",
            body: "Fine-bubble disc diffusers on retainer rings.",
          },
          tube: {
            name: "Tube membranes",
            body: "Tube diffusers on a perforated core.",
          },
          cta: "See compatibility detail",
        },
      },
    }),
  ),
}));

async function renderSection(locale: "en" | "es" | "zh" = "en") {
  const { HomeMembraneTypeSection } =
    await import("@/components/sections/home-membrane-type-section");
  const element = await HomeMembraneTypeSection({ locale });
  return render(element);
}

const MEMBRANE_HREF = /^\/membranes\/[a-z0-9-]+$/;

describe("Feature: HomeMembraneTypeSection real routes", () => {
  it("renders the section heading and both type cards", async () => {
    await renderSection();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Start from the membrane format you run",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Disc membranes")).toBeInTheDocument();
    expect(screen.getByText("Tube membranes")).toBeInTheDocument();
  });

  it("links the disc card to a real descriptive membrane route", async () => {
    await renderSection();
    const links = screen.getAllByRole("link");
    const discLink = links.find((l) =>
      l.textContent?.includes("Disc membranes"),
    );
    expect(discLink).toBeDefined();
    const href = discLink?.getAttribute("href") ?? "";
    expect(href).toMatch(MEMBRANE_HREF);
    expect(href).not.toBe("/membranes");
    expect(href).toBe("/membranes/9-inch-epdm-disc-replacement");
  });

  it("links the tube card to a real descriptive membrane route", async () => {
    await renderSection();
    const links = screen.getAllByRole("link");
    const tubeLink = links.find((l) =>
      l.textContent?.includes("Tube membranes"),
    );
    expect(tubeLink).toBeDefined();
    const href = tubeLink?.getAttribute("href") ?? "";
    expect(href).toMatch(MEMBRANE_HREF);
    expect(href).not.toBe("/membranes");
  });
});
