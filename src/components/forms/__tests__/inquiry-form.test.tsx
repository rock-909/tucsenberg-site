import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_LEAD_PRODUCT_NAME_LENGTH } from "@/constants/validation-limits";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { InquiryFormStaticFallback } from "@/components/forms/inquiry-form-static-fallback";
import {
  CONFIG_PREFILL_MAX_LENGTH,
  createInquiryPayload,
} from "@/components/forms/inquiry-payload";
import { createTestInquiryFormCopy } from "@/test/inquiry-test-messages";

vi.mock("@/components/forms/lazy-turnstile", () => ({
  LazyTurnstile: ({
    action,
    onError,
    onExpire,
    onSuccess,
  }: {
    action?: string;
    onError?: () => void;
    onExpire?: () => void;
    onSuccess?: (token: string) => void;
  }) => (
    <div data-action={action} data-testid="inquiry-turnstile">
      <button
        data-testid="inquiry-turnstile-success"
        onClick={() => onSuccess?.("mock-inquiry-turnstile-token")}
        type="button"
      >
        Complete verification
      </button>
      <button
        data-testid="inquiry-turnstile-expire"
        onClick={() => onExpire?.()}
        type="button"
      >
        Expire verification
      </button>
      <button
        data-testid="inquiry-turnstile-error"
        onClick={() => onError?.()}
        type="button"
      >
        Fail verification
      </button>
    </div>
  ),
}));

const FORBIDDEN_CONTROL_NAMES = [
  "phone",
  "company",
  "subject",
  "catalogProductId",
  "quantity",
  "country",
  "port",
  "budget",
] as const;

function renderInquiryForm(source: "contact" | "request-quote" = "contact") {
  const copy = createTestInquiryFormCopy();
  const utils = render(<InquiryForm copy={copy} source={source} />);
  return { copy, ...utils };
}

function getFormControls(container: HTMLElement) {
  const form = within(container).getByTestId("inquiry-form");
  return {
    form,
    fullName: within(form).getByLabelText(/^Full name/i),
    email: within(form).getByLabelText(/^Email address/i),
    message: within(form).getByLabelText(/^Message/i),
  };
}

function assertThreeFieldContract(
  container: HTMLElement,
  copy: ReturnType<typeof createTestInquiryFormCopy>,
) {
  const { fullName, email, message, form } = getFormControls(container);

  expect(fullName).toHaveAttribute("name", "fullName");
  expect(fullName).toHaveAttribute("required");
  expect(fullName).toHaveAttribute("autocomplete", "name");
  expect(fullName).toHaveAttribute("type", "text");

  expect(email).toHaveAttribute("name", "email");
  expect(email).toHaveAttribute("required");
  expect(email).toHaveAttribute("autocomplete", "email");
  expect(email).toHaveAttribute("type", "email");

  expect(message).toHaveAttribute("name", "message");
  expect(message).not.toHaveAttribute("required");
  expect(within(form).getByText(`(${copy.optional})`)).toBeInTheDocument();

  expect(form.querySelector('input[type="tel"]')).toBeNull();
  for (const name of FORBIDDEN_CONTROL_NAMES) {
    expect(form.querySelector(`[name="${name}"]`)).toBeNull();
  }
}

function getFetchBody(): Record<string, unknown> {
  const requestInit = vi.mocked(fetch).mock.calls.at(-1)?.[1];
  expect(requestInit).toBeDefined();
  return JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
}

describe("InquiryForm contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    delete (window as unknown as Record<string, unknown>).gtag;
    global.fetch = vi.fn(async () =>
      Response.json({
        success: true,
        data: { referenceId: "inq-ref-1" },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["contact", "contact"] as const,
    ["request-quote", "request-quote"] as const,
  ])("renders the same three-field contract in %s mode", (source) => {
    const { container, copy } = renderInquiryForm(source);
    assertThreeFieldContract(container, copy);
  });

  it("uses identical labels and autocomplete in both page modes", () => {
    const contact = renderInquiryForm("contact");
    const contactControls = getFormControls(contact.container);

    contact.unmount();

    const rfq = renderInquiryForm("request-quote");
    const rfqControls = getFormControls(rfq.container);

    expect(contactControls.fullName.textContent).toBe(
      rfqControls.fullName.textContent,
    );
    expect(contactControls.email.getAttribute("autocomplete")).toBe("email");
    expect(rfqControls.email.getAttribute("autocomplete")).toBe("email");
  });

  it("posts to /api/inquiry with optional blank message", async () => {
    const { container, copy } = renderInquiryForm("contact");
    const { fullName, email, form } = getFormControls(container);

    fireEvent.click(screen.getByTestId("inquiry-turnstile-success"));
    fireEvent.change(fullName, { target: { value: "Ada Buyer" } });
    fireEvent.change(email, { target: { value: "ada@example.com" } });

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/inquiry",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(getFetchBody()).toMatchObject({
      fullName: "Ada Buyer",
      email: "ada@example.com",
      productInquiryKind: "general-rfq",
      turnstileToken: "mock-inquiry-turnstile-token",
    });
    expect(getFetchBody()).not.toHaveProperty("message");
    await screen.findByText(
      `${copy.success} ${copy.referenceLabel}: inq-ref-1`,
    );
  });

  it("submits on Enter from a text control once Turnstile is ready", async () => {
    const { container } = renderInquiryForm("contact");
    const { fullName, email, form } = getFormControls(container);

    fireEvent.click(screen.getByTestId("inquiry-turnstile-success"));
    fireEvent.change(fullName, { target: { value: "Enter Buyer" } });
    fireEvent.change(email, { target: { value: "enter@example.com" } });

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("does not post without a Turnstile token", async () => {
    const { container, copy } = renderInquiryForm("contact");
    const { fullName, email, form } = getFormControls(container);

    fireEvent.change(fullName, { target: { value: "No Token" } });
    fireEvent.change(email, { target: { value: "token@example.com" } });

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText(copy.errors.securitySummary)).toBeInTheDocument();
  });

  it("shows field, security, and server summaries from the decoder", async () => {
    const copy = createTestInquiryFormCopy();
    const { container } = render(<InquiryForm copy={copy} source="contact" />);
    const { fullName, email, form } = getFormControls(container);

    fireEvent.click(screen.getByTestId("inquiry-turnstile-success"));
    fireEvent.change(fullName, { target: { value: "Error Buyer" } });
    fireEvent.change(email, { target: { value: "error@example.com" } });

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          errorCode: "INQUIRY_VALIDATION_FAILED",
          details: ["errors.fullName.required"],
        }),
        { status: 400 },
      ),
    );

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(
      await screen.findByText(copy.errors.fieldSummary),
    ).toBeInTheDocument();
  });
});

describe("InquiryForm URL handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async () =>
      Response.json({
        success: true,
        data: { referenceId: "inq-ref-rfq" },
      }),
    );
  });

  function setSearch(search: string) {
    vi.stubGlobal("location", {
      ...window.location,
      href: `http://localhost/request-quote${search}`,
      pathname: "/request-quote",
      search,
    });
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("caps interest, shows it as untrusted context, and submits buyerInterest only", async () => {
    const interest = "x".repeat(MAX_LEAD_PRODUCT_NAME_LENGTH + 50);
    setSearch(`?interest=${encodeURIComponent(interest)}`);
    const { container, copy } = renderInquiryForm("request-quote");
    const capped = "x".repeat(MAX_LEAD_PRODUCT_NAME_LENGTH);

    expect(
      screen.getByTestId("inquiry-buyer-interest-context"),
    ).toHaveTextContent(capped);
    expect(
      screen.getByTestId("inquiry-buyer-interest-context"),
    ).toHaveTextContent(copy.contextLabel);

    const { fullName, email, form } = getFormControls(container);
    fireEvent.click(screen.getByTestId("inquiry-turnstile-success"));
    fireEvent.change(fullName, { target: { value: "RFQ Buyer" } });
    fireEvent.change(email, { target: { value: "rfq@example.com" } });

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(getFetchBody()).toMatchObject({
      buyerInterest: capped,
      productInquiryKind: "general-rfq",
    });
    expect(getFetchBody()).not.toHaveProperty("catalogProductId");
  });

  it("caps config, pre-fills the visible message, and keeps it editable", async () => {
    const config = "c".repeat(CONFIG_PREFILL_MAX_LENGTH + 20);
    setSearch(`?config=${encodeURIComponent(config)}`);
    const { container } = renderInquiryForm("request-quote");
    const { message } = getFormControls(container);

    expect(message).toHaveValue("c".repeat(CONFIG_PREFILL_MAX_LENGTH));
    fireEvent.change(message, {
      target: { value: "Edited estimator summary" },
    });
    expect(message).toHaveValue("Edited estimator summary");
  });

  it("ignores URL context in contact mode", () => {
    setSearch("?interest=frp-planks&config=should-not-appear");
    const { container } = renderInquiryForm("contact");

    expect(screen.queryByTestId("inquiry-buyer-interest-context")).toBeNull();
    expect(getFormControls(container).message).toHaveValue("");
  });
});

describe("InquiryFormStaticFallback", () => {
  it("shows the no-JS explanation and public email without a form or submit control", () => {
    const copy = createTestInquiryFormCopy();
    const { container } = render(<InquiryFormStaticFallback copy={copy} />);

    expect(screen.getByText(copy.noJsExplanation)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    );
    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("createInquiryPayload", () => {
  it("builds the canonical general RFQ body", () => {
    const formData = new FormData();
    formData.set("fullName", "Payload Buyer");
    formData.set("email", "payload@example.com");
    formData.set("message", "Need details");

    expect(createInquiryPayload(formData, "token-1", "aluminum gates")).toEqual(
      expect.objectContaining({
        fullName: "Payload Buyer",
        email: "payload@example.com",
        message: "Need details",
        buyerInterest: "aluminum gates",
        productInquiryKind: "general-rfq",
        turnstileToken: "token-1",
      }),
    );
  });
});
