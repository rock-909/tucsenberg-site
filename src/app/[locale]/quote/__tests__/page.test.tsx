/**
 * Quote (RFQ) page coverage.
 *
 * The page is a Server Component reading async `params`/`searchParams` and
 * rendering a co-located Client Component (`QuoteForm`). We mock the i18n
 * boundaries (server + client) and the JSON-LD script, then render the real
 * form so the search-param pre-fill, live summary, and JSON POST submission
 * are exercised end to end.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuotePage, { generateStaticParams } from "../page";
import { QuoteFormSection } from "../quote-form-section";

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es", "zh"], defaultLocale: "en" },
}));

function makeTranslator(namespace?: string) {
  const scope = namespace ? namespace.replace(/^quote\.?/, "") : "";
  return (key: string, values?: Record<string, string>) => {
    const composed = scope ? `${scope}.${key}` : key;
    return values?.email ? `${composed}:${values.email}` : composed;
  };
}

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn((options?: { namespace?: string }) =>
    makeTranslator(options?.namespace),
  ),
  setRequestLocale: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn((namespace?: string) => makeTranslator(namespace)),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
}));

// The Turnstile widget is a lazy network island with its own coverage; stub it
// to a deterministic button that hands back a token on click so the
// submit-gating and POST body assertions stay focused on the form.
vi.mock("@/components/forms/lazy-turnstile", () => ({
  LazyTurnstile: ({ onSuccess }: { onSuccess?: (token: string) => void }) => (
    <button
      type="button"
      data-testid="mock-turnstile"
      onClick={() => onSuccess?.("test-turnstile-token")}
    >
      verify
    </button>
  ),
}));

/**
 * The page wraps the searchParams-consuming form in `<Suspense>` (required by
 * Cache Components). RTL cannot resolve an async Server Component inside
 * Suspense, so the form behaviors are exercised by rendering the resolved
 * `QuoteFormSection` directly while the static hero is checked via the page.
 */
async function renderQuoteForm(
  searchParams: Record<string, string> = {},
): Promise<void> {
  const section = await QuoteFormSection({
    searchParams: Promise.resolve(searchParams),
  });
  render(section);
}

async function renderQuotePage(): Promise<void> {
  const ui = await QuotePage({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({}),
  });
  render(ui);
}

describe("RFQ quote page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("generates a param for every locale", () => {
    expect(generateStaticParams()).toEqual([
      { locale: "en" },
      { locale: "es" },
      { locale: "zh" },
    ]);
  });

  it("renders the hero heading from the page shell", async () => {
    await renderQuotePage();

    expect(
      screen.getByRole("heading", { level: 1, name: "hero.title" }),
    ).toBeInTheDocument();
  });

  it("renders an empty summary with response/lead-time defaults", async () => {
    await renderQuoteForm();

    expect(screen.getByText("summary.empty")).toBeInTheDocument();
    expect(screen.getByText("summary.responseTimeValue")).toBeInTheDocument();
  });

  it("pre-fills part numbers from ?sku and quantity from ?quantity", async () => {
    await renderQuoteForm({ sku: "TUC-D9-EPDM", quantity: "250" });

    expect(screen.getByLabelText(/form\.partNumbers/)).toHaveValue(
      "TUC-D9-EPDM",
    );
    expect(screen.getByLabelText(/form\.quantity/)).toHaveValue("250");
  });

  it("pre-fills part numbers from ?partNumber when ?sku is absent", async () => {
    await renderQuoteForm({ partNumber: "9 in disc" });

    expect(screen.getByLabelText(/form\.partNumbers/)).toHaveValue("9 in disc");
  });

  it("echoes ?brand and ?model context in the summary panel", async () => {
    await renderQuoteForm({ brand: "sanitaire", model: "magnum" });

    const summary = screen.getByTestId("quote-summary");
    expect(summary).toHaveTextContent("sanitaire");
    expect(summary).toHaveTextContent("magnum");
  });

  it("keeps submit disabled until a Turnstile token exists", async () => {
    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });

    const submit = screen.getByRole("button", { name: "form.submit" });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByTestId("mock-turnstile"));
    expect(submit).toBeEnabled();
  });

  it("submits a JSON RFQ POST to /api/quote and shows the success state", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { referenceId: "RFQ-1" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));

    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      type: "rfq",
      partNumbers: "TUC-D9-EPDM",
      fullName: "Dana Ops",
      email: "dana@example.com",
      turnstileToken: "test-turnstile-token",
    });

    await waitFor(() => {
      expect(screen.getByText("success.title")).toBeInTheDocument();
    });
    expect(
      screen.getByText("success.description:dana@example.com"),
    ).toBeInTheDocument();
  });

  it("shows the network error message when the POST rejects", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(new Error("offline"));

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));

    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("errors.networkError")).toBeInTheDocument();
    });
  });

  it("maps a non-OK API error code to its translated message", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, errorCode: "INVALID_REQUEST" }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    );

    await renderQuoteForm({ sku: "TUC-D9-EPDM" });

    fireEvent.change(screen.getByLabelText(/form\.name/), {
      target: { value: "Dana Ops" },
    });
    fireEvent.change(screen.getByLabelText(/form\.email/), {
      target: { value: "dana@example.com" },
    });
    fireEvent.click(screen.getByTestId("mock-turnstile"));

    fireEvent.submit(screen.getByTestId("quote-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/quote",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("apiErrors.INVALID_REQUEST")).toBeInTheDocument();
    });
  });
});
