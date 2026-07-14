import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RequestQuotePage, { generateMetadata } from "../page";

const { mockGenerateMetadataForPath } = vi.hoisted(() => ({
  mockGenerateMetadataForPath: vi.fn(async () => ({
    title: "Request a Quote",
    description: "Request a quote",
  })),
}));

vi.mock("next-intl/server", async () => {
  const {
    getRequestQuoteFormMessage,
    getRequestQuoteMetadataMessage,
    getRequestQuotePageMessage,
  } = await import("@/test/request-quote-test-messages");

  return {
    setRequestLocale: vi.fn(),
    getTranslations: vi.fn(
      async ({
        namespace,
      }: {
        locale?: string;
        namespace:
          | "requestQuote.form"
          | "requestQuote.metadata"
          | "requestQuote.page";
      }) => {
        if (namespace === "requestQuote.form") {
          return (key: string) => getRequestQuoteFormMessage(key);
        }
        if (namespace === "requestQuote.metadata") {
          return (key: string) => getRequestQuoteMetadataMessage(key);
        }

        return (key: string, values?: Record<string, string | number>) =>
          getRequestQuotePageMessage(key, values);
      },
    ),
  };
});

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
          title: "Request a Quote — 12-Hour Response on Standard Items",
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
    const nameField = screen.getByLabelText("Your name");
    expect(nameField).toBeRequired();
    const emailField = screen.getByLabelText("Work email");
    expect(emailField).toHaveAttribute("type", "email");
    expect(emailField).toBeRequired();
    const messageField = screen.getByLabelText("What do you need?");
    expect(messageField.tagName).toBe("TEXTAREA");
    expect(messageField).not.toBeRequired();
    expect(screen.getByText(/product line, opening sizes/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Received. Standard items: quote within 12 hours. Custom: within 48. You'll hear from a person, not a sequence.",
      ),
    ).toBeInTheDocument();
  });
});
