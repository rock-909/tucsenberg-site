import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ValidatedInquiryContext } from "@/lib/lead-pipeline/inquiry-handoff";
import RequestQuotePage, { generateMetadata } from "../page";

const capturedInquiryFormProps = vi.hoisted(() => ({
  latest: null as {
    context: ValidatedInquiryContext;
  } | null,
}));

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

vi.mock("@/components/forms/inquiry-form", () => ({
  InquiryForm: ({ context }: { context: ValidatedInquiryContext }) => {
    capturedInquiryFormProps.latest = { context };
    return (
      <div data-testid="mock-inquiry-form">
        {context.kind === "catalog-context" ? (
          <span data-testid="catalog-context-label">
            {context.displayLabel}
          </span>
        ) : null}
        {context.initialMessage ? (
          <textarea
            data-testid="initial-message"
            defaultValue={context.initialMessage}
          />
        ) : null}
      </div>
    );
  },
}));

describe("RequestQuotePage", () => {
  beforeEach(() => {
    mockGenerateMetadataForPath.mockClear();
    mockJsonLdGraphScript.mockClear();
    capturedInquiryFormProps.latest = null;
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
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Get real numbers, fast" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("mock-inquiry-form")).toBeInTheDocument();
    expect(capturedInquiryFormProps.latest?.context).toEqual({
      kind: "general-context",
    });
    expect(
      screen.getByText("Received. You'll hear from a person, not a sequence."),
    ).toBeInTheDocument();
  });

  it("passes catalog-context for a valid catalogProductId", async () => {
    const page = await RequestQuotePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        catalogProductId: "frp-flood-barriers",
      }),
    });

    render(page);

    expect(screen.getByTestId("catalog-context-label")).toHaveTextContent(
      "FRP Composite Planks",
    );
    expect(capturedInquiryFormProps.latest?.context).toEqual({
      kind: "catalog-context",
      catalogProductId: "frp-flood-barriers",
      displayLabel: "FRP Composite Planks",
    });
  });

  it("downgrades forged or repeated catalogProductId values to general-context", async () => {
    const forgedPage = await RequestQuotePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        catalogProductId: "forged-product",
      }),
    });
    render(forgedPage);
    expect(screen.queryByTestId("catalog-context-label")).toBeNull();
    expect(capturedInquiryFormProps.latest?.context).toEqual({
      kind: "general-context",
    });

    const repeatedPage = await RequestQuotePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        catalogProductId: ["abs-flood-barriers", "frp-flood-barriers"],
      }),
    });
    render(repeatedPage);
    expect(capturedInquiryFormProps.latest?.context).toEqual({
      kind: "general-context",
    });
  });

  it("passes estimator config into the validated initial message", async () => {
    const page = await RequestQuotePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        catalogProductId: "abs-flood-barriers",
        config: "Estimated 12 straight units",
      }),
    });

    render(page);

    expect(screen.getByTestId("initial-message")).toHaveValue(
      "Estimated 12 straight units",
    );
  });

  it("injects request-quote WebPage JSON-LD through the shared graph script", async () => {
    const page = await RequestQuotePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
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
