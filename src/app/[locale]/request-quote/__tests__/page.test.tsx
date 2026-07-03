import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RequestQuotePage, { generateMetadata } from "../page";

const { mockGenerateMetadataForPath } = vi.hoisted(() => ({
  mockGenerateMetadataForPath: vi.fn(async () => ({
    title: "Request a Quote",
    description: "Request a quote",
  })),
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
}));

vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: mockGenerateMetadataForPath,
}));

describe("RequestQuotePage", () => {
  beforeEach(() => {
    mockGenerateMetadataForPath.mockClear();
  });

  it("uses the owner-approved RFQ meta title", async () => {
    await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(mockGenerateMetadataForPath).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          title:
            "Request a Quote — 12-Hour Response on Standard Items | Tucsenberg",
        }),
      }),
    );
  });

  it("renders the owner-approved RFQ form fields and success copy", async () => {
    const page = await RequestQuotePage({
      params: Promise.resolve({ locale: "en" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Get real numbers, fast" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Request a quote" }),
    ).toHaveAttribute("data-analytics-event", "rfq_submit");
    expect(
      screen.getByLabelText("What are you protecting?"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Opening width × height / run length"),
    ).toBeInTheDocument();
    const mountingSurface = screen.getByRole("combobox", {
      name: "Mounting surface / ground type",
    });
    expect(mountingSurface).toBeInTheDocument();
    expect(
      within(mountingSurface).getByRole("option", { name: "Other" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Material preference")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    expect(screen.getByLabelText("Market & delivery port")).toBeInTheDocument();
    expect(screen.getByLabelText("Timeline")).toBeInTheDocument();
    expect(screen.getByLabelText("Photos / drawings upload")).toHaveAttribute(
      "type",
      "file",
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Company")).toBeInTheDocument();
    expect(screen.getByLabelText("WhatsApp")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "This is a wholesale / OEM / private label enquiry",
      ),
    ).toHaveAttribute("type", "checkbox");
    expect(
      screen.getByText(
        "Received. Standard items: quote within 12 hours. Custom: within 48. You'll hear from a person, not a sequence.",
      ),
    ).toBeInTheDocument();
  });
});
