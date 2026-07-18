import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RequestQuotePage, { generateMetadata } from "../page";

const { mockGenerateMetadataForPath, mockJsonLdGraphScript } = vi.hoisted(
  () => ({
    mockGenerateMetadataForPath: vi.fn(async () => ({
      title: "Request a Quote",
      description: "Request a quote",
    })),
    mockJsonLdGraphScript: vi.fn(),
  }),
);

vi.mock("next-intl/server", async () => {
  const {
    getRequestQuoteFormMessage,
    getRequestQuoteMetadataMessage,
    getRequestQuotePageMessage,
  } = await import("@/test/request-quote-test-messages");
  const { getInquiryFormMessage } =
    await import("@/test/inquiry-test-messages");

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
          | "requestQuote.page"
          | "inquiry.form";
      }) => {
        if (namespace === "requestQuote.form") {
          return (key: string) => getRequestQuoteFormMessage(key);
        }
        if (namespace === "requestQuote.metadata") {
          return (key: string) => getRequestQuoteMetadataMessage(key);
        }
        if (namespace === "inquiry.form") {
          return (key: string) => getInquiryFormMessage(key);
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

vi.mock("@/components/seo/json-ld-script", () => ({
  JsonLdGraphScript: ({
    locale,
    data = [],
  }: {
    locale: string;
    data?: readonly unknown[];
  }) => {
    mockJsonLdGraphScript({ locale, data });
    return null;
  },
}));

describe("RequestQuotePage", () => {
  beforeEach(() => {
    mockGenerateMetadataForPath.mockClear();
    mockJsonLdGraphScript.mockClear();
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
    const nameField = screen.getByLabelText("Full name");
    expect(nameField).toBeRequired();
    const emailField = screen.getByLabelText("Email address");
    expect(emailField).toHaveAttribute("type", "email");
    expect(emailField).toBeRequired();
    const messageField = screen.getByLabelText(/^Message/i);
    expect(messageField.tagName).toBe("TEXTAREA");
    expect(messageField).not.toBeRequired();
    expect(
      screen.getByText(/product interest, opening sizes/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Received. You'll hear from a person, not a sequence."),
    ).toBeInTheDocument();
  });

  it("injects request-quote WebPage JSON-LD through the shared graph script", async () => {
    const page = await RequestQuotePage({
      params: Promise.resolve({ locale: "en" }),
    });

    render(page);

    expect(mockJsonLdGraphScript).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        data: [
          expect.objectContaining({
            "@type": "WebPage",
            name: "Request a Quote — 12-Hour Response on Standard Items",
            url: expect.stringMatching(/\/request-quote$/u),
            isPartOf: expect.objectContaining({
              "@id": expect.stringMatching(/#website$/u),
            }),
            about: expect.objectContaining({
              "@id": expect.stringMatching(/#organization$/u),
            }),
          }),
        ],
      }),
    );
  });
});
