import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ValidatedInquiryContext } from "@/lib/lead-pipeline/inquiry-handoff";
import { RequestQuoteInquiryForm } from "../request-quote-inquiry-form";
import { createTestInquiryFormCopy } from "@/test/inquiry-test-messages";
import { InquiryFormStaticFallback } from "@/components/forms/inquiry-form-static-fallback";

const capturedInquiryFormProps = vi.hoisted(() => ({
  latest: null as {
    context: ValidatedInquiryContext;
  } | null,
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

const inquiryCopy = createTestInquiryFormCopy();
const inquiryFallback = <InquiryFormStaticFallback copy={inquiryCopy} />;

async function renderResolvedInquiryForm(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const form = await RequestQuoteInquiryForm({
    searchParams: Promise.resolve(searchParams),
    inquiryCopy,
    inquiryFallback,
  });
  render(form);
}

describe("RequestQuoteInquiryForm", () => {
  beforeEach(() => {
    capturedInquiryFormProps.latest = null;
  });

  it("passes catalog-context for a valid catalogProductId", async () => {
    await renderResolvedInquiryForm({
      catalogProductId: "frp-flood-barriers",
    });

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
    await renderResolvedInquiryForm({
      catalogProductId: "forged-product",
    });
    expect(screen.queryByTestId("catalog-context-label")).toBeNull();
    expect(capturedInquiryFormProps.latest?.context).toEqual({
      kind: "general-context",
    });

    capturedInquiryFormProps.latest = null;
    await renderResolvedInquiryForm({
      catalogProductId: ["abs-flood-barriers", "frp-flood-barriers"],
    });
    expect(capturedInquiryFormProps.latest?.context).toEqual({
      kind: "general-context",
    });
  });

  it("passes estimator config into the validated initial message", async () => {
    await renderResolvedInquiryForm({
      catalogProductId: "abs-flood-barriers",
      config: "Estimated 12 straight units",
    });

    expect(screen.getByTestId("initial-message")).toHaveValue(
      "Estimated 12 straight units",
    );
  });

  it("defaults missing search params to general-context", async () => {
    await renderResolvedInquiryForm({});

    expect(capturedInquiryFormProps.latest?.context).toEqual({
      kind: "general-context",
    });
  });
});
